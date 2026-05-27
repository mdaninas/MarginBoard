from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.methodology import MethodologyResponse, MethodologySection

router = APIRouter(prefix="/methodology", tags=["methodology"])


_METHODOLOGY_EN = MethodologyResponse(
    dataset=MethodologySection(
        title="Dataset",
        body=[
            "Source: Online Retail II (UCI Machine Learning Repository).",
            "Transactional dataset for a UK-based online retailer covering Dec 2009–Dec 2011.",
            "Key fields: invoice id, stock code, description, quantity, invoice date, unit price, customer id, country.",
            "The dataset does not include real current stock levels or confirmed fraud labels.",
        ],
    ),
    data_cleaning=MethodologySection(
        title="Data Cleaning",
        body=[
            "Source columns are standardized to a snake_case internal schema (e.g. Invoice → invoice_id, Price → unit_price).",
            "Invoice date is parsed as datetime; rows with unparsable dates are dropped.",
            "Rows missing invoice id, stock code, quantity, or unit price are dropped.",
            "Rows with negative unit price are dropped (data entry errors).",
            "Negative quantities are preserved — they represent returns or cancellations.",
            "The cleaned frame is cached as a parquet file for fast subsequent loads.",
        ],
    ),
    revenue=MethodologySection(
        title="Revenue Calculation",
        body=[
            "revenue = quantity × unit_price.",
            "A return line (quantity < 0) produces negative revenue, which lowers net revenue for the period.",
            "Average order value uses unique invoice ids in the denominator, not raw line counts.",
            "Active customers count unique non-null customer ids in the selected period.",
            "Growth comparisons use the previous period of equal length immediately before the current range.",
            "Currency is displayed as USD in the UI for readability; no FX conversion is applied from the source GBP figures.",
        ],
    ),
    forecasting=MethodologySection(
        title="Forecasting",
        body=[
            "Daily revenue is reindexed to a continuous range with missing days filled as zero.",
            "Features: day-of-week, month, week-of-year, is-weekend, lag 1, lag 7, rolling 7 / 14 / 30 day means.",
            "Model: GradientBoostingRegressor (n_estimators=300, learning_rate=0.05, max_depth=3, random_state=42).",
            "Validation: chronological 80/20 split; metrics reported are MAE and MAPE on the held-out window.",
            "Forecast horizon: 30 days. Predictions are generated iteratively — each day feeds its lag features into the next.",
            "The model uses only historical revenue. External factors (promotions, holidays, macro events) are not included.",
        ],
    ),
    inventory=MethodologySection(
        title="Inventory Risk (Simulated)",
        body=[
            "Real current stock is not available in the dataset, so simulated stock is generated transparently.",
            "estimated_demand = average daily units sold over the last 90 days × 30-day horizon.",
            "safety_stock = standard deviation of daily demand × 1.65 (≈ 95% service level).",
            "simulated_stock = estimated_demand × coverage_ratio, where coverage_ratio is derived deterministically from the stock code (range 0.3–2.0).",
            "recommended_reorder = max(0, estimated_demand + safety_stock − simulated_stock).",
            "potential_lost_revenue = max(0, estimated_demand − simulated_stock) × average unit price.",
            "Risk level: Low if stock_gap ≤ 0, Medium if ≤ 30% of demand, High otherwise.",
        ],
    ),
    transactions=MethodologySection(
        title="Transaction Anomaly Monitoring",
        body=[
            "The dataset does not include confirmed fraud labels. This feature is anomaly monitoring, not fraud detection.",
            "Approach: hybrid — transparent rule-based reason codes combined with an IsolationForest anomaly score.",
            "Rule thresholds use the 99th percentile of absolute quantity, unit price, and transaction value.",
            "Reason codes include: negative quantity, unusually high quantity, extreme unit price, unusually high transaction value, invoice cancellation pattern.",
            "Risk level: High if score ≥ 0.85, Medium if ≥ 0.60, Low otherwise.",
            "Flagged transactions are surfaced for human review only.",
        ],
    ),
    limitations=MethodologySection(
        title="Limitations",
        body=[
            "No real-time data — the dataset is historical (Dec 2009 – Dec 2011).",
            "No real stock levels — inventory values are simulated and clearly labelled.",
            "No confirmed fraud labels — anomalies are pattern-based, not verified.",
            "Forecast does not include external factors (holidays, promotions, macro events).",
            "Model accuracy is reported on a validation split; production accuracy would require ongoing monitoring.",
            "Customer ID is missing for a portion of rows; active customer counts only include identified customers.",
        ],
    ),
)


_METHODOLOGY_ID = MethodologyResponse(
    dataset=MethodologySection(
        title="Dataset",
        body=[
            "Sumber: Online Retail II (UCI Machine Learning Repository).",
            "Dataset transaksi peritel daring berbasis di Inggris yang mencakup Des 2009–Des 2011.",
            "Kolom utama: id invoice, kode stok, deskripsi, kuantitas, tanggal invoice, harga satuan, id pelanggan, negara.",
            "Dataset tidak menyertakan level stok riil saat ini maupun label fraud yang terverifikasi.",
        ],
    ),
    data_cleaning=MethodologySection(
        title="Pembersihan Data",
        body=[
            "Nama kolom sumber distandarkan ke skema internal snake_case (mis. Invoice → invoice_id, Price → unit_price).",
            "Tanggal invoice di-parse sebagai datetime; baris dengan tanggal tidak valid dibuang.",
            "Baris tanpa id invoice, kode stok, kuantitas, atau harga satuan dibuang.",
            "Baris dengan harga satuan negatif dibuang (kesalahan input data).",
            "Kuantitas negatif tetap dipertahankan — mewakili retur atau pembatalan.",
            "Frame yang sudah bersih di-cache sebagai parquet untuk pemuatan cepat berikutnya.",
        ],
    ),
    revenue=MethodologySection(
        title="Perhitungan Pendapatan",
        body=[
            "pendapatan = kuantitas × harga_satuan.",
            "Baris retur (kuantitas < 0) menghasilkan pendapatan negatif, yang menurunkan pendapatan bersih periode tersebut.",
            "Rata-rata nilai order memakai id invoice unik sebagai penyebut, bukan jumlah baris mentah.",
            "Pelanggan aktif menghitung id pelanggan unik non-null pada periode terpilih.",
            "Perbandingan pertumbuhan memakai periode sebelumnya dengan panjang sama yang berada tepat sebelum rentang current.",
            "Mata uang ditampilkan dalam USD di UI untuk keterbacaan; tidak ada konversi kurs yang diterapkan dari angka sumber dalam GBP.",
        ],
    ),
    forecasting=MethodologySection(
        title="Peramalan",
        body=[
            "Pendapatan harian di-reindex ke rentang kontinu, hari yang kosong diisi nol.",
            "Fitur: hari dalam minggu, bulan, minggu dalam tahun, flag akhir pekan, lag 1, lag 7, rata-rata bergulir 7 / 14 / 30 hari.",
            "Model: GradientBoostingRegressor (n_estimators=300, learning_rate=0.05, max_depth=3, random_state=42).",
            "Validasi: split kronologis 80/20; metrik yang dilaporkan adalah MAE dan MAPE pada jendela yang ditahan.",
            "Horison peramalan: 30 hari. Prediksi dibuat iteratif — setiap hari mengisi fitur lag untuk hari berikutnya.",
            "Model hanya memakai pendapatan historis. Faktor eksternal (promosi, hari libur, makro) tidak disertakan.",
        ],
    ),
    inventory=MethodologySection(
        title="Risiko Stok (Simulasi)",
        body=[
            "Stok riil saat ini tidak tersedia di dataset, jadi stok disimulasikan secara transparan.",
            "estimated_demand = rata-rata unit terjual harian selama 90 hari terakhir × horison 30 hari.",
            "safety_stock = standar deviasi permintaan harian × 1,65 (≈ 95% service level).",
            "simulated_stock = estimated_demand × coverage_ratio, di mana coverage_ratio diturunkan deterministik dari kode stok (rentang 0,3–2,0).",
            "recommended_reorder = max(0, estimated_demand + safety_stock − simulated_stock).",
            "potential_lost_revenue = max(0, estimated_demand − simulated_stock) × harga satuan rata-rata.",
            "Level risiko: Rendah jika stock_gap ≤ 0, Sedang jika ≤ 30% permintaan, Tinggi selain itu.",
        ],
    ),
    transactions=MethodologySection(
        title="Pemantauan Anomali Transaksi",
        body=[
            "Dataset tidak menyertakan label fraud yang terverifikasi. Fitur ini adalah pemantauan anomali, bukan deteksi fraud.",
            "Pendekatan: hibrida — reason code berbasis aturan transparan dipadukan dengan skor IsolationForest.",
            "Ambang aturan memakai persentil ke-99 dari nilai absolut kuantitas, harga satuan, dan nilai transaksi.",
            "Reason code mencakup: kuantitas negatif, kuantitas sangat tinggi, harga satuan ekstrem, nilai transaksi sangat tinggi, pola pembatalan invoice.",
            "Level risiko: Tinggi jika skor ≥ 0,85, Sedang jika ≥ 0,60, Rendah selain itu.",
            "Transaksi yang tertanda dimunculkan hanya untuk peninjauan manusia.",
        ],
    ),
    limitations=MethodologySection(
        title="Keterbatasan",
        body=[
            "Tidak ada data real-time — dataset bersifat historis (Des 2009 – Des 2011).",
            "Tidak ada level stok riil — nilai inventaris disimulasikan dan diberi label jelas.",
            "Tidak ada label fraud yang terverifikasi — anomali berbasis pola, belum diverifikasi.",
            "Forecast tidak menyertakan faktor eksternal (hari libur, promosi, peristiwa makro).",
            "Akurasi model dilaporkan pada split validasi; akurasi produksi akan butuh pemantauan berkelanjutan.",
            "ID pelanggan kosong untuk sebagian baris; hitungan pelanggan aktif hanya mencakup pelanggan teridentifikasi.",
        ],
    ),
)


@router.get("", response_model=MethodologyResponse)
def methodology(
    lang: str = Query(default="en", description="Language: 'en' or 'id'."),
) -> MethodologyResponse:
    return _METHODOLOGY_ID if lang.lower() == "id" else _METHODOLOGY_EN
