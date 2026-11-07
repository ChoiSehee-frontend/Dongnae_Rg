#!/usr/bin/env python3
"""SGIS 2015~2024 행정구역별 인구총괄 CSV ZIP → 흥해읍/북부생활권 같은 출처 시계열.

Example:
  python scripts/build_sgis_population_series.py --input "C:/Downloads/SGIS"

Input: SGIS 자료신청에서 내려받은 2015~2024 경상북도(37) 인구·가구·주택 행정구역 통계 ZIP.
Unpacked CSV files are also accepted. Does not synthesize absent years or extrapolate forecasts.
"""
from pathlib import Path
import argparse
import csv
import io
import json
import re
import sys
import zipfile
from datetime import date

REGIONS = [
    ('흥해읍', '37012110'), ('신광면', '37012310'), ('청하면', '37012320'),
    ('송라면', '37012330'), ('기계면', '37012350'), ('죽장면', '37012360'), ('기북면', '37012370'),
]
# Safer source of the precise SGIS adm codes: project's existing 2024 town-metrics file.


def read_total_population_csv(blob, source):
    for enc in ('cp949', 'utf-8-sig', 'utf-8'):
        try:
            raw = blob.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError(f'Unable to decode source file: {source}')
    out = {}
    years = set()
    for row in csv.reader(io.StringIO(raw)):
        if len(row) < 4:
            continue
        year, code, typ, val = [x.strip() for x in row[:4]]
        if typ != 'to_in_001' or not year.isdigit() or not val.replace(',', '').isdigit():
            continue
        years.add(int(year))
        if code in out:
            raise ValueError(f'Duplicate area code in {source}: {code}')
        out[code] = int(val.replace(',', ''))
    if not years or len(years) > 1:
        raise ValueError(f'Invalid/multiple years in {source}: {years}')
    return years.pop(), out


def iter_csv(path):
    if path.suffix.lower() == '.zip':
        with zipfile.ZipFile(path) as zipf:
            for n in zipf.namelist():
                if not n.lower().endswith('.csv'):
                    continue
                # ZIP filenames in SGIS have Korean Unicode titles; CP437 decoding can vary.
                # Identify exact file by content, not only filename.
                blob = zipf.read(n)
                if b'to_in_001' not in blob:
                    continue
                yield f'{path.name}/{n}', blob
    elif path.suffix.lower() == '.csv':
        blob = path.read_bytes()
        if b'to_in_001' in blob:
            yield path.name, blob


def main():
    arg = argparse.ArgumentParser(description='Build a source-consistent SGIS population time-series for Pohang.')
    arg.add_argument('--input', required=True, help='Directory containing the SGIS CSV/ZIP files from 2015 through 2024')
    arg.add_argument('--output', default=str(Path(__file__).resolve().parents[1] / 'src' / 'data' / 'sgis-population-2015-2024.json'))
    opts = arg.parse_args()
    folder = Path(opts.input)
    if not folder.is_dir():
        sys.exit(f'Input directory not found: {folder}')
    project_root = Path(__file__).resolve().parents[1]
    names = json.loads((project_root/'src/data/town-metrics.json').read_text(encoding='utf-8'))
    name_to_code = {x['adm_nm']: x['adm_cd'] for x in names}
    missing_names = [nm for nm, _ in REGIONS if nm not in name_to_code]
    if missing_names:
        sys.exit(f'Town code missing in existing JSON: {missing_names}')
    observed = {}
    sources = {}
    for file in sorted(folder.rglob('*')):
        if not file.is_file() or file.suffix.lower() not in ('.zip', '.csv'):
            continue
        for label, blob in iter_csv(file):
            try:
                year, records = read_total_population_csv(blob, label)
            except ValueError:
                continue
            if not 2015 <= year <= 2024:
                continue
            codes = [name_to_code[n] for n, _ in REGIONS]
            if any(code not in records for code in codes):
                continue
            if year in observed:
                if observed[year] != records:
                    sys.exit(f'CONFLICT: Year {year} provided in different source files. Verify duplicates.')
                continue
            observed[year] = records
            sources[year] = label

    baseline_path = project_root / 'src/data/sgis-baseline-2023-2024.json'
    if baseline_path.exists():
        baseline = json.loads(baseline_path.read_text(encoding='utf-8'))
        for entry in baseline['yearly']:
            year = int(entry['year'])
            codes_and_values = {name_to_code[n]: int(val) for n, val in entry['towns'].items()}
            if year not in observed:
                observed[year] = codes_and_values
                sources[year] = 'bundled and reverified original SGIS 2023/2024 data'
            elif any(observed[year].get(code) != val for code, val in codes_and_values.items()):
                sys.exit(f'CONFLICT: SGIS {year} differs from the previously verified original ZIP')

    years = []
    for year in sorted(observed):
        v = observed[year]
        town = int(v[name_to_code['흥해읍']])
        northern = sum(v[name_to_code[n]] for n, _ in REGIONS)
        years.append({'year': year, 'heunghae': town, 'north': northern})
    missing = [y for y in range(2015, 2025) if y not in observed]
    result = {
        'source': 'SGIS 센서스 공간통계 행정구역별 인구총괄(총인구), to_in_001',
        'sourceYears': '2015 and 2016–2024',
        'scope': '포항시 북구 흥해읍; 북부생활권 7개 읍·면 동일 행정코드 합산',
        'areaCodes': {nm: name_to_code[nm] for nm, _ in REGIONS},
        'yearly': years,
        'missingYears': missing,
        'filesUsed': [f'{y}: {sources[y]}' for y in sorted(sources)],
        'readyForLongTermProjection': len(missing) == 0,
        'notes': [
            '원자료는 행정구역별 인구총괄(총인구)이며 주민등록인구통계와 혼용 금지',
            '행정코드는 기존 SGIS 2024 데이터의 코드로 통일; 경계 개편 여부 별도 검증 필요',
            '2030 계획의 북부생활권 목표 인구 122000명은 2030 포항 도시기본계획 표4-12',
            '연도별 자료 미확보 시 보간·임의 채움 금지',
        ],
    }
    dst = Path(opts.output)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f'OK: wrote {dst}')
    print(f'Years present: {sorted(observed)}, missing: {missing}')
    for row in years:
        print(f"{row['year']}: 흥해읍 {row['heunghae']:,}명 / 북부생활권 {row['north']:,}명")
    if missing:
        print('NOTICE: 2030 trend projection remains disabled until all 2015–2024 yearly sources are present.')
    else:
        print('10 yearly records complete. Check historic administrative boundaries before interpreting projections.')


if __name__ == '__main__':
    main()
