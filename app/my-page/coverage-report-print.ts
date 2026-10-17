// Shared by the on-screen sheets, the isolated print document and PNG capture.
export const REPORT_CSS = `
.coverage-report-page{box-sizing:border-box;width:794px;height:1123px;padding:38px 36px 32px;background:#fff;color:#23344e;font-family:Arial,'Malgun Gothic',sans-serif;position:relative;overflow:hidden;text-align:left;letter-spacing:0}
.coverage-report-page *{box-sizing:border-box}
.coverage-report-page h1{font-size:27px;line-height:1.4;margin:12px 0 8px;font-weight:700;letter-spacing:-1px}
.coverage-report-page h1 span{color:#3279c6}
.cr-eyebrow{font-size:10px;letter-spacing:2px;color:#6a8caf;font-weight:700}
.cr-heading{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #345d86;padding-bottom:18px;margin-bottom:18px}
.cr-heading p{margin:0;color:#7a899b;font-size:11px}
.cr-meta{font-size:11px;line-height:1.8;text-align:right;color:#65748b;max-width:230px;overflow-wrap:anywhere}
.cr-summary{display:grid;grid-template-columns:repeat(3,1fr);background:#eff5fc;border:1px solid #dbe6f3;border-radius:5px;padding:18px 0;margin:0 0 22px}
.cr-summary>div{padding:0 18px;border-right:1px solid #d4e1ef}.cr-summary>div:last-child{border:0}
.cr-summary small{display:block;font-size:10px;color:#68809a;margin-bottom:6px}.cr-summary strong{font-size:19px;color:#264f7a}.cr-summary strong em{font-size:11px;font-style:normal;font-weight:400}
.cr-section-label{font-size:12px;font-weight:700;margin:0 0 10px;display:flex;justify-content:space-between}.cr-section-label span{font-size:10px;font-weight:400;color:#8392a5}
.cr-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 14px;align-items:stretch}
.cr-card{border:1px solid #dce5f0;border-radius:5px;overflow:hidden;min-height:133px}
.cr-card h2{font-size:12px;margin:0;padding:8px 11px;background:#edf4fb;color:#305f8c;font-weight:700}
.cr-card dl{margin:0;padding:4px 10px}.cr-card dl>div{display:flex;gap:5px;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eff2f6;font-size:9px;line-height:1.3}.cr-card dl>div:last-child{border:0}.cr-card dt{color:#607085}.cr-card dd{margin:0;text-align:right;color:#263d56;font-weight:700;max-width:96px;overflow-wrap:anywhere}
.cr-note{margin-top:18px;padding:12px 14px;border:1px solid #dce5f0;border-radius:5px;font-size:11px;line-height:1.6;white-space:pre-wrap}.cr-note strong{display:block;color:#426588;margin-bottom:4px}
.cr-footer{position:absolute;bottom:24px;left:36px;right:36px;display:flex;justify-content:space-between;border-top:1px solid #dce5f0;padding-top:10px;color:#8896a8;font-size:9px}
.cr-detail .cr-heading{padding-bottom:12px;margin-bottom:12px}.cr-detail h1{font-size:23px}
.cr-detail table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:9px;line-height:10px}.cr-detail th,.cr-detail td{border:1px solid #dce5f0;padding:0 4px;height:12px;overflow-wrap:anywhere;vertical-align:middle}.cr-detail thead th{background:#edf4fb;color:#345b80;font-weight:700;padding:6px 4px}.cr-detail tbody th{font-weight:400;text-align:left}.cr-detail td{text-align:right}.cr-detail .cr-category{background:#f2f6fb;text-align:center;font-weight:700;color:#446b91}.cr-detail .cr-total{background:#f6f9fd;color:#285985;font-weight:700}.cr-detail .cr-policy-meta td{text-align:center;height:20px;max-height:30px}.cr-detail .cr-policy-meta th{background:#f6f9fd;color:#607991}.cr-detail .cr-product{font-size:9px;height:30px}.cr-detail .cr-table-gap{height:7px;border:0}
.cr-book{--cr-accent:#d48847;--cr-secondary:#63788a;--cr-soft:#fff4e9;--cr-tint:#edf2f6}
.cr-reference,.cr-original,.cr-remodeled{display:contents}
.cr-reference .coverage-report-page{color:#303c47;padding:42px 38px 35px}
.cr-reference .cr-heading{border-color:var(--cr-accent)}.cr-reference .cr-heading h1 span{color:var(--cr-accent)}.cr-reference .cr-eyebrow{color:var(--cr-secondary)}
.cr-reference .cr-summary{background:var(--cr-soft);border-color:#e1dfda}.cr-reference .cr-summary strong{color:var(--cr-secondary)}
.cr-reference .cr-card{border-radius:5px;border-color:#d9dee2;min-height:144px}.cr-reference .cr-card h2{background:var(--cr-soft);color:var(--cr-secondary)}.cr-reference .cr-card:nth-child(2n) h2{background:var(--cr-tint)}.cr-reference .cr-card dd{color:var(--cr-secondary)}
.cr-reference .cr-detail thead th,.cr-reference .cr-category{background:var(--cr-tint);color:var(--cr-secondary)}.cr-reference .cr-total,.cr-reference .cr-policy-meta th{background:var(--cr-soft);color:var(--cr-accent)}
.cr-remodeled .cr-heading:before{content:'리모델링 후';position:absolute;right:38px;top:20px;font-size:10px;color:var(--cr-accent)}
.cr-band{display:flex;align-items:baseline;justify-content:center;gap:12px;min-height:92px;padding:26px 12px;background:var(--cr-soft);border-top:2px solid var(--cr-accent);border-bottom:1px solid #dfdcd5;margin-bottom:30px}.cr-band strong{font-size:27px}.cr-band span{font-size:17px;color:var(--cr-secondary)}
.cr-compare-labels{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:0 0 18px 46px}.cr-compare-labels span{font-size:16px;text-align:center;padding:14px;background:var(--cr-tint);border-top:2px solid var(--cr-secondary)}.cr-compare-labels span:last-child{background:var(--cr-soft);border-color:var(--cr-accent)}
.cr-compare-table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:10px}.cr-compare-table th,.cr-compare-table td{height:19px;border-bottom:1px dotted #ced1d2;padding:2px 6px;text-align:left;font-weight:400}.cr-compare-table td{text-align:right;white-space:nowrap}.cr-compare-table tbody:nth-child(even){background:var(--cr-soft)}.cr-compare-table tbody tr:last-child>*{border-bottom:1px dotted #ced1d2}.cr-compare-table .cr-compare-category{text-align:center;font-size:11px;font-weight:700;border-right:1px solid #d9dce0;color:var(--cr-secondary)}.cr-compare-table .cr-gutter{border:0;background:white}
.cr-compare-money{display:grid;grid-template-columns:140px 1fr 1fr;gap:12px;padding:17px 10px;margin-top:20px;background:var(--cr-soft);font-size:12px;text-align:center}.cr-compare-money b{font-size:10px;font-weight:500}.cr-compare-total{background:var(--cr-tint);margin-top:10px}
.cr-summary-columns{display:grid;grid-template-columns:1fr 1fr;gap:24px}.cr-contract-total{display:flex;align-items:center;justify-content:space-between;border:1px solid #cfd4d8;margin-bottom:18px;min-height:62px;font-size:11px}.cr-contract-total span{padding:14px;background:var(--cr-tint);flex:1}.cr-contract-total strong{padding:12px;font-size:13px;color:var(--cr-secondary)}.cr-summary-columns section:last-child .cr-contract-total span{background:var(--cr-soft)}.cr-summary-columns table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:10px}.cr-summary-columns th,.cr-summary-columns td{border:1px solid #d2d6da;padding:8px 6px;height:84px;overflow-wrap:anywhere;font-weight:400;text-align:center}.cr-summary-columns th{background:var(--cr-tint)}.cr-summary-columns section:last-child th{background:var(--cr-soft)}.cr-summary-columns td:last-child{font-size:10px}
.cr-savings{margin-top:38px;padding:22px 14px;background:var(--cr-soft);text-align:center;border-top:1px solid var(--cr-accent)}.cr-savings p{font-size:13px;line-height:2.2;margin:3px 0}.cr-savings strong{color:var(--cr-accent);font-size:22px;margin:0 7px}
.cr-cover{background:linear-gradient(155deg,var(--cr-soft),#fff 42%)!important}.cr-cover-name{font-size:17px;letter-spacing:.2px;margin:35px 0 25px}.cr-cover-name strong{font-size:28px;margin-right:8px;color:var(--cr-secondary)}
.cr-reference .cr-cover-title{font-size:49px;letter-spacing:-2px;line-height:1.5;margin:0 0 24px;color:var(--cr-cover-title,var(--cr-secondary));border-bottom:1px solid var(--cr-accent);padding-bottom:24px}.cr-reference .cr-cover-title span{color:var(--cr-cover-title-accent,var(--cr-accent))}.cr-cover-description{font-size:11px;line-height:1.9;color:#7b8790;margin-bottom:38px}
.cr-cover-panels{display:grid;grid-template-columns:1.1fr 1fr;gap:20px}.cr-cover-contracts,.cr-radar{border:1px solid #d8dee3;border-radius:5px;background:#ffffffc9;position:relative;height:252px;padding:20px}.cr-cover-contracts h2{font-size:16px;margin:0 0 23px;color:var(--cr-secondary)}.cr-cover-contracts h2 small{font-size:11px;font-weight:400;margin-left:8px}.cr-cover-contracts dl{width:65%;font-size:10px;margin:0}.cr-cover-contracts dl>div{display:flex;justify-content:space-between;margin-bottom:10px}.cr-cover-contracts dd{margin:0;font-weight:600}.cr-cover-contracts .cr-paid-row{margin-top:24px}.cr-donut{position:absolute;width:95px;height:95px;right:12px;top:84px}.cr-donut circle:last-of-type{stroke:var(--cr-accent)}.cr-radar{padding:0 10px}.cr-radar svg{width:100%;height:222px}.cr-radar polygon:last-child{stroke:var(--cr-accent);fill:var(--cr-soft)}.cr-radar>p{text-align:center;font-size:9px;color:#8e979e;margin:-3px 0 0}
.cr-pillars{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin:42px 12px}.cr-pillars>div{color:var(--cr-accent)!important;text-align:center}.cr-pillars>div:nth-child(even){color:var(--cr-secondary)!important}.cr-pillars>div>div{border:1px solid currentColor;border-radius:50%;width:80px;height:80px;display:flex;align-items:center;justify-content:center;margin:auto;background:var(--cr-soft)}.cr-pillars>div:nth-child(even)>div{background:var(--cr-tint)}.cr-pillars strong{display:block;font-size:12px;margin-top:12px;font-weight:500}
.cr-cover-bottom{display:grid;grid-template-columns:1fr 1.2fr;gap:35px;align-items:center;margin-top:32px}.cr-insurance-art{color:var(--cr-secondary);display:flex;align-items:center;gap:12px}.cr-insurance-art svg{width:85px}.cr-insurance-art span{font-size:10px;line-height:2;color:var(--cr-accent);letter-spacing:1px}.cr-cover-bottom table{width:100%;border-collapse:collapse;border-top:2px solid var(--cr-accent);font-size:10px}.cr-cover-bottom td,.cr-cover-bottom th{height:29px;border-bottom:1px dotted #cfd4d7;font-weight:400;padding:5px 8px;text-align:center;overflow-wrap:anywhere}.cr-cover-bottom th{background:var(--cr-soft);width:75px}
.cr-reference .cr-detail{padding:24px 38px 32px}.cr-reference .cr-detail .cr-eyebrow{display:none}.cr-reference .cr-detail .cr-heading{padding-bottom:8px;margin-bottom:8px;align-items:flex-end}.cr-reference .cr-detail h1{font-size:23px;line-height:26px;margin:0 0 3px;white-space:nowrap}.cr-reference .cr-detail .cr-heading p{font-size:13px;line-height:16px}.cr-reference .cr-detail .cr-meta{font-size:13px;line-height:16px}.cr-reference .cr-detail table{font-size:13px;line-height:14px}.cr-reference .cr-detail th,.cr-reference .cr-detail td{height:15.3px;padding:0 4px}.cr-reference .cr-detail thead th{padding:2px 4px;height:20px}.cr-reference .cr-detail .cr-policy-meta td{height:16px;font-size:13px}.cr-reference .cr-detail .cr-policy-meta th{height:16px}.cr-reference .cr-detail .cr-product{font-size:13px!important;height:24px!important}.cr-reference .cr-detail .cr-footer{bottom:12px;font-size:11px}.cr-reference .cr-heading h1{white-space:nowrap}.cr-reference .cr-card dl>div{font-size:13px;line-height:16px;padding:3px 0}.cr-reference .cr-card h2{font-size:14px}.cr-reference .cr-card{min-height:150px}.cr-reference .cr-card dl{padding:5px 8px}.cr-reference .cr-card dd{max-width:92px}.cr-reference .cr-card dt{max-width:136px}.cr-reference .cr-summary small{font-size:13px}.cr-reference .cr-section-label,.cr-reference .cr-section-label span{font-size:13px}.cr-reference .cr-footer{font-size:11px}.cr-reference .cr-meta,.cr-reference .cr-heading p{font-size:13px}.cr-reference .cr-note{font-size:13px}.cr-reference .cr-compare-table{font-size:13px;line-height:16px}.cr-reference .cr-compare-table th,.cr-reference .cr-compare-table td{height:21px;padding:1px 5px}.cr-reference .cr-compare-category{font-size:13px!important}.cr-reference .cr-compare-money b{font-size:13px}.cr-reference .cr-contract-total,.cr-reference .cr-summary-columns table,.cr-reference .cr-summary-columns td:last-child{font-size:13px}.cr-reference .cr-cover-description,.cr-reference .cr-cover-contracts dl,.cr-reference .cr-cover-contracts h2 small,.cr-reference .cr-pillars strong,.cr-reference .cr-cover-bottom table,.cr-reference .cr-radar>p{font-size:13px}
.cr-reference .cr-detail{padding-top:22px}.cr-reference .cr-detail th,.cr-reference .cr-detail td{height:15px}.cr-reference .cr-detail .cr-product{height:20px!important}
.cr-reference .cr-detail .cr-category{white-space:pre-line;word-break:keep-all}.cr-reference .cr-detail .cr-policy-meta th{text-align:center}.cr-reference .cr-detail .cr-category{padding-left:0;padding-right:0}
.cr-reference .cr-detail{padding-top:16px}.cr-reference .cr-detail .cr-heading p{display:none}.cr-reference .cr-detail .cr-heading{padding-bottom:6px;margin-bottom:8px}.cr-reference .cr-detail table{font-size:11px;line-height:12px}.cr-reference .cr-detail th,.cr-reference .cr-detail td{height:15.5px;padding:1px 4px}.cr-reference .cr-detail .cr-policy-meta th,.cr-reference .cr-detail .cr-policy-meta td{height:18px;font-size:12px;line-height:14px;text-align:center}.cr-reference .cr-detail .cr-policy-meta th{padding-left:2px;padding-right:2px}.cr-reference .cr-detail .cr-product{height:22px!important;font-size:12px!important}.cr-reference .cr-detail .cr-footer{bottom:6px}.cr-reference .cr-detail thead th{text-align:center}
.cr-reference .cr-detail .cr-policy-meta th{background:white;color:#6b7786}.cr-reference .cr-monthly-block{text-align:center!important;background:white}.cr-monthly-block span{display:block;padding:10px 5px;background:#f6f7f9;color:#6b7786}.cr-monthly-block strong{display:block;padding:12px 5px;background:var(--cr-soft);color:var(--cr-secondary);font-size:15px}
.cr-reference table th,.cr-reference table td,.cr-reference .cr-card,.cr-reference .cr-card dl>div,.cr-reference .cr-summary,.cr-reference .cr-footer,.cr-reference .cr-cover-contracts,.cr-reference .cr-radar,.cr-reference .cr-compare-money,.cr-reference .cr-contract-total,.cr-reference .cr-band{border-color:var(--cr-line,#dce5f0)}.cr-reference .cr-heading,.cr-reference .cr-cover-title,.cr-reference .cr-cover-bottom table{border-color:var(--cr-accent)}
.cr-remodeled .cr-heading:before{display:none}.cr-remodel-label{display:inline-block;font-size:12px;line-height:18px;margin-right:8px;vertical-align:middle;padding:2px 6px;background:var(--cr-soft);color:var(--cr-secondary);border-radius:3px}.cr-reference .cr-detail .cr-heading{flex-wrap:wrap}.cr-reference .cr-detail .cr-meta{margin-left:auto}.cr-reference .cr-detail th,.cr-reference .cr-detail td{height:16px}
.cr-reference .cr-detail .cr-group-heading th{background:var(--cr-tint);color:var(--cr-secondary);height:22px;text-align:center;font-weight:700}.cr-contract-count{padding:9px 5px;font-size:11px;color:#78848e}.cr-contract-count b{font-size:18px;color:var(--cr-secondary);margin:0 4px}
.cr-cover-hero{height:180px;position:relative;margin:-22px 0 22px;border-radius:5px;overflow:hidden;background:linear-gradient(125deg,var(--cr-soft),var(--cr-tint),#ffffff)}.cr-cover-hero img{display:block;width:330px;height:220px;object-fit:contain;margin:-15px auto 0}.cr-cover-bottom{position:absolute;bottom:65px;left:38px;right:38px;display:block;margin:0}.cr-cover-bottom table{width:350px;margin-left:auto}.cr-cover-contracts .cr-donut circle:first-child{stroke:var(--cr-soft)}
.cr-reference .cr-detail th,.cr-reference .cr-detail td{height:15.75px}
.cr-comparison .cr-band{min-height:70px;margin-bottom:20px;padding:20px 12px}.cr-comparison-hero{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}.cr-comparison-hero>div{padding:16px;border:1px solid var(--cr-line);border-radius:5px;background:#fafbfc}.cr-comparison-hero>div:last-child{background:var(--cr-soft)}.cr-comparison-hero span{display:block;color:#7b8791;font-size:11px;margin-bottom:8px}.cr-comparison-hero strong{font-size:23px;color:var(--cr-secondary)}.cr-reference .cr-compare-table th,.cr-reference .cr-compare-table td{height:20px;padding:2px 5px;font-size:11px;line-height:14px}.cr-compare-table thead th{background:var(--cr-tint);height:30px!important;color:var(--cr-secondary);text-align:center;font-weight:700}.cr-compare-table .cr-compare-category{white-space:pre-line;word-break:keep-all;font-size:11px!important}.cr-compare-table .cr-proposed{color:var(--cr-secondary);font-weight:600}.cr-compare-table .cr-change{color:var(--cr-accent);font-size:10px}.cr-comparison-foot{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:18px 12px;margin-top:24px;border-top:1px solid var(--cr-accent);background:var(--cr-soft);font-size:11px}.cr-comparison-foot strong{color:var(--cr-secondary)}
.cr-reference .cr-monthly-block{padding:8px 12px!important;vertical-align:middle}.cr-monthly-block span{background:white;padding:0 0 7px;font-size:11px;color:#7f8b97}.cr-monthly-block strong{background:white;padding:0;font-size:21px;line-height:1.3}.cr-monthly-block strong small{font-size:11px;font-weight:400;margin-left:4px}.cr-monthly-block .cr-contract-count{display:inline-block;background:#f5f6f8;border-radius:4px;margin-top:8px;padding:4px 9px;font-size:10px}.cr-contract-count b{font-size:12px;margin:0 3px;color:#5d6c7b}
@page{size:A4 portrait;margin:0}
@media print{html,body{margin:0!important;padding:0!important;background:white!important}.coverage-report-page{margin:0!important;box-shadow:none!important;break-after:page;page-break-after:always;print-color-adjust:exact;-webkit-print-color-adjust:exact}.coverage-report-page:last-child{break-after:auto;page-break-after:auto}}

.cr-reference .cr-detail .cr-policy-meta th,.cr-reference .cr-detail .cr-policy-meta td,.cr-reference .cr-detail .cr-product{font-size:11px!important;line-height:12px}
.cr-reference .cr-detail th,.cr-reference .cr-detail td{height:15.3px}
.cr-reference .cr-detail .cr-ornament{padding:0;background:radial-gradient(circle at 0 25%,transparent 18px,var(--cr-line) 19px,transparent 20px),radial-gradient(circle at 100% 75%,transparent 27px,var(--cr-line) 28px,transparent 29px),linear-gradient(160deg,var(--cr-soft),white);color:var(--cr-accent);text-align:center}
.cr-ornament div{font-size:23px;opacity:.65}

.cr-reference .cr-cards > .cr-card:last-child{grid-column:1 / -1;min-height:0;display:flex;align-items:center}.cr-reference .cr-cards > .cr-card:last-child h2{border-bottom:0;min-width:90px}.cr-reference .cr-cards > .cr-card:last-child dl{flex:1}
.cr-cover>.cr-radar{height:180px;margin:-22px 0 22px;padding:0;border:0;border-radius:0;background:transparent}.cr-cover>.cr-radar svg{display:block;width:100%;height:180px}
.cr-cover-panels{grid-template-columns:.9fr 1.2fr}
.cr-cover-panels>.cr-cover-hero{height:252px;margin:0;padding:0;border:0;border-radius:0;background:transparent;overflow:visible;display:flex;align-items:center;justify-content:center}
.cr-cover-panels>.cr-cover-hero img{display:block;width:100%;height:100%;max-width:none;margin:0;object-fit:contain}

.cr-premium-summary{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:160px;width:100%;font-size:13px;color:#284261}.cr-premium-summary svg{display:block;max-width:100%;margin:6px auto}.cr-premium-summary>span{display:block;width:100%;padding:8px 4px;text-align:center;background:#f7f9fc}.cr-premium-summary>strong{display:block;width:100%;padding:10px 4px;text-align:center;background:#fff0df;color:#243b53;font-size:15px;font-weight:700}.cr-reference .cr-detail td.cr-premium-cell{padding:0;vertical-align:middle}.cr-reference .cr-detail .cr-premium-summary{min-height:0;font-size:11px}.cr-reference .cr-detail .cr-premium-summary svg{height:48px;width:90px;margin:2px auto}.cr-reference .cr-detail .cr-premium-summary>span{padding:6px 2px}.cr-reference .cr-detail .cr-premium-summary>strong{padding:8px 2px;font-size:14px}.cr-reference .cr-detail td.cr-analysis-total{font-weight:700;color:#dd8a16;text-align:center}

.cr-reference .cr-policy-meta .cr-policy-product-row>th,.cr-reference .cr-policy-meta .cr-policy-product-row>td{background:var(--cr-soft,#edf4ff)}.cr-reference .cr-policy-meta .cr-policy-premium-row>th,.cr-reference .cr-policy-meta .cr-policy-premium-row>td{background:var(--cr-tint,#f5f8fd)}

.cr-reference .cr-cover{isolation:isolate;background:var(--cr-cover-background,linear-gradient(155deg,var(--cr-soft),#fff 42%))!important;background-size:var(--cr-cover-background-size,auto)!important}
.cr-reference .cr-cover:before{content:"";position:absolute;inset:18px;border:var(--cr-cover-frame,0 solid transparent);border-radius:5px;pointer-events:none;z-index:-1}

.cr-reference .cr-cover>.cr-cover-hero{height:200px;margin:-12px 0 22px;background:transparent!important;border:0;border-radius:0;overflow:visible}
.cr-reference .cr-cover>.cr-cover-hero img{display:block;width:100%;height:200px;object-fit:contain;margin:0}
.cr-reference .cr-cover-panels{grid-template-columns:1.1fr 1fr;gap:20px}
.cr-reference .cr-cover-panels>.cr-radar{height:252px;margin:0;padding:0 10px;border:1px solid var(--cr-line);border-radius:5px;background:#ffffffc9}
.cr-reference .cr-cover-panels>.cr-radar svg{display:block;width:100%;height:240px}

/* Fill the printable detail area while keeping the disclosure clear. */
.cr-reference .cr-detail table{height:980px}

/* Report panels share the status-card corner radius on screen and paper. */
.cr-reference :is(.cr-summary,.cr-card,.cr-note,.cr-cover-contracts,.cr-cover-panels>.cr-radar,.cr-comparison-hero>div,.cr-contract-total,.cr-band,.cr-comparison-foot,.cr-savings){border-radius:5px}
.cr-reference .cr-contract-total{overflow:hidden}

/* One report set: identical page margins, heading and footer on every sheet. */
.cr-reference .coverage-report-page{padding:42px 38px 64px;font-family:Arial,'Malgun Gothic',sans-serif}
.cr-reference .coverage-report-page .cr-set-heading{display:block;min-height:0;padding:0 0 18px;margin:0 0 18px;border-bottom:2px solid var(--cr-accent);border-radius:0;background:transparent}
.cr-reference .coverage-report-page .cr-set-heading h1{font-size:27px;line-height:38px;font-weight:700;letter-spacing:-1px;white-space:normal;margin:0 0 8px;color:#303c47}
.cr-reference .coverage-report-page .cr-set-heading p{display:block;font-size:13px;line-height:18px;font-weight:400;letter-spacing:0;color:#7a899b;margin:0}
.cr-reference .coverage-report-page .cr-set-footer{left:38px;right:38px;bottom:24px;padding-top:10px;margin:0;display:flex;justify-content:space-between;gap:16px;border-top:1px solid var(--cr-line);font-size:11px;line-height:16px;font-weight:400;color:#8896a8}
.cr-set-footer>span:last-child{white-space:nowrap;text-align:right}
.cr-reference .cr-detail table{height:910px}

/* Compact the shared top spacing across the complete report set. */
.cr-reference .coverage-report-page{padding-top:24px}
.cr-reference .coverage-report-page .cr-set-heading{padding-bottom:10px;margin-bottom:10px}
.cr-reference .coverage-report-page .cr-set-heading h1{margin-bottom:4px}
.cr-reference .cr-detail table{height:880px}
.cr-reference .cr-detail th,.cr-reference .cr-detail td{height:14px;padding-top:0;padding-bottom:0}

/* Stretch content to the shared footer clearance, rather than a fixed table height. */
.cr-reference .coverage-report-page:not(.cr-cover){display:flex;flex-direction:column;padding-bottom:70px}
.cr-reference .coverage-report-page:not(.cr-cover)>.cr-set-heading,.cr-reference .coverage-report-page>.cr-summary,.cr-reference .coverage-report-page>.cr-note,.cr-reference .cr-comparison-hero,.cr-reference .cr-comparison-foot,.cr-reference .cr-savings{flex-shrink:0}
.cr-reference .cr-detail>table{height:auto;flex:1;min-height:0}
.cr-reference .cr-cards{flex:1;min-height:0;grid-template-rows:repeat(4,minmax(0,1fr))}
.cr-reference .cr-cards>.cr-card{min-height:0;display:flex;flex-direction:column}
.cr-reference .cr-cards>.cr-card>h2{flex-shrink:0}
.cr-reference .cr-cards>.cr-card>dl{display:flex;flex-direction:column;flex:1}
.cr-reference .cr-cards>.cr-card>dl>div{flex:1;align-items:center}
.cr-reference .cr-cards>.cr-card:last-child{flex-direction:row}
.cr-reference .cr-cards>.cr-card:last-child>dl{display:block}
.cr-reference .cr-comparison>.cr-compare-table{height:auto;flex:1}
.cr-reference .cr-remodel-summary>.cr-summary-columns{flex:1;min-height:0}
.cr-reference .cr-summary-columns>section{display:flex;flex-direction:column;min-height:0}
.cr-reference .cr-summary-columns .cr-contract-total{flex-shrink:0}
.cr-reference .cr-summary-columns table{height:auto;flex:1}

.cr-reference .cr-detail .cr-policy-product-row>th,.cr-reference .cr-detail .cr-policy-product-row>td{height:36px!important;min-height:36px;line-height:16px;white-space:normal;overflow-wrap:anywhere}

.cr-reference .cr-detail .cr-policy-product-row>td{white-space:pre-wrap;word-break:normal;overflow-wrap:anywhere}

.cr-reference .cr-detail .cr-policy-product-row>th,.cr-reference .cr-detail .cr-policy-product-row>td{height:50px!important;min-height:50px}
.cr-product-name{display:block;overflow:hidden;max-height:48px;line-height:16px;white-space:pre-wrap;overflow-wrap:anywhere;text-overflow:clip}

/* Liability belongs to the fracture/burn card; all twelve status cards share the grid. */
.cr-reference .cr-cards>.cr-card:last-child{grid-column:auto;display:flex;flex-direction:column;align-items:stretch}
.cr-reference .cr-cards>.cr-card:last-child h2{border-bottom:initial;min-width:0}
.cr-reference .cr-cards>.cr-card:last-child>dl{display:flex;flex-direction:column}

/* Cover retains its own title composition rather than a body-page heading. */
.cr-reference .coverage-report-page.cr-cover{padding-top:64px}

.cr-reference .cr-detail th.cr-category{line-height:1.4;white-space:pre-line}

/* Fewer coverage rows receive more height within the same printable area. */
.cr-reference .cr-detail>table{flex:0 0 auto}
.cr-reference .cr-detail .cr-coverage-row>th,.cr-reference .cr-detail .cr-coverage-row>td{height:inherit}

.cr-reference .cr-detail .cr-coverage-row>th:not(.cr-category){text-align:center;vertical-align:middle}

.cr-reference .cr-detail .cr-coverage-row>td{text-align:center;vertical-align:middle}

.cr-reference .cr-detail .cr-policy-meta th{color:#000000}

.cr-reference .cr-detail .cr-policy-meta .cr-policy-remaining-row>th,.cr-reference .cr-detail .cr-policy-meta .cr-policy-remaining-row>td{color:#8896a8}

.cr-reference .cr-detail .cr-policy-meta .cr-policy-premium-row>th,.cr-reference .cr-detail .cr-policy-meta .cr-policy-premium-row>td{color:var(--cr-secondary);font-weight:700}

.cr-reference .cr-summary{background:linear-gradient(110deg,var(--cr-tint),var(--cr-soft) 55%,#fff 100%)}

.cr-reference .cr-cards>.cr-card>h2{text-align:center}

.cr-reference .cr-summary{background:radial-gradient(ellipse at 48% 0%,rgba(255,255,255,.75),rgba(255,255,255,0) 66%),linear-gradient(155deg,var(--cr-tint) 0%,var(--cr-soft) 48%,#fff 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}

.cr-reference .cr-cover-bottom th,.cr-reference .cr-cover-bottom td{height:35px}

.cr-reference .cr-cover-bottom{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:20px;align-items:center}
.cr-reference .cr-cover-bottom>.cr-cover-hero{height:185px;margin:0;background:transparent;border:0;border-radius:0;overflow:visible}
.cr-reference .cr-cover-bottom>.cr-cover-hero img{display:block;width:100%;height:185px;margin:0;object-fit:contain}
.cr-reference .cr-cover-bottom>table{width:350px;margin:0}

.cr-reference .cr-cover-name{font-size:21px}.cr-reference .cr-cover-name strong{font-size:34px}

.cr-reference .cr-cover-name{margin-bottom:12px}

.cr-reference .cr-cover-contracts dt{font-weight:400}.cr-reference .cr-cover-contracts dd{font-weight:400}.cr-reference .cr-cover-contracts dl>div:nth-child(-n+2) dd,.cr-reference .cr-cover-contracts .cr-cover-total-row dd{font-weight:700}.cr-reference .cr-cover-contracts .cr-paid-row{margin-top:20px}

.cr-reference .cr-cover-panels>.cr-radar svg{width:88%;height:210px;margin:20px auto 0}

.cr-reference .cr-cover-panels{grid-template-columns:1.25fr 1fr;gap:18px}
.cr-reference .cr-cover-contracts,.cr-reference .cr-cover-panels>.cr-radar{height:280px}
.cr-reference .cr-cover-contracts{padding:18px}
.cr-reference .cr-cover-contracts h2{margin-bottom:18px}
.cr-reference .cr-cover-contracts dl{width:72%}
.cr-reference .cr-cover-contracts dl>div{margin-bottom:9px}
.cr-reference .cr-cover-contracts .cr-paid-row{margin-top:16px}
.cr-reference .cr-cover-contracts .cr-donut{width:72px;height:72px;right:9px;top:104px}
.cr-reference .cr-cover-panels>.cr-radar svg{margin-top:34px}

.cr-reference .cr-cover :is(.cr-cover-description,.cr-cover-contracts dl,.cr-cover-contracts h2 small,.cr-cover-bottom table,.cr-footer,.cr-radar>p){font-size:14px}
.cr-reference .cr-cover .cr-radar svg text{font-size:14px}

.cr-reference .cr-cover-contracts dl{width:64%}
.cr-reference .cr-cover-contracts .cr-donut{width:108px;height:108px;right:8px;top:98px}

/* Cover overview: centered heading, figures left, large payment ring right. */
.cr-reference .cr-cover-panels{grid-template-columns:1.4fr 1fr;gap:14px}
.cr-reference .cr-cover-contracts,.cr-reference .cr-cover-panels>.cr-radar{height:240px}
.cr-reference .cr-cover-contracts{padding:18px}
.cr-reference .cr-cover-contracts h2{text-align:center;font-size:18px;line-height:24px;margin:0 0 16px}
.cr-reference .cr-cover-contracts h2 small{font-size:14px;margin-left:8px}
.cr-reference .cr-cover-contracts dl{width:59%;font-size:14px;line-height:20px}
.cr-reference .cr-cover-contracts dl>div{margin-bottom:4px;align-items:baseline}
.cr-reference .cr-cover-contracts dd{white-space:nowrap}
.cr-reference .cr-cover-contracts .cr-paid-row{margin-top:18px}
.cr-reference .cr-cover-contracts .cr-donut{width:140px;height:140px;right:10px;top:66px}
.cr-reference .cr-cover-panels>.cr-radar svg{width:94%;height:218px;margin:10px auto 0}

.cr-reference .cr-cover-contracts{display:flex;flex-direction:column;justify-content:center}
.cr-reference .cr-cover-contracts h2{flex-shrink:0}
.cr-reference .cr-cover-contracts .cr-donut{top:50%;transform:translateY(-50%)}
.cr-reference .cr-cover-panels>.cr-radar{display:flex;align-items:center;justify-content:center}
.cr-reference .cr-cover-panels>.cr-radar svg{margin:0 auto}

.cr-reference .cr-cover-panels{grid-template-columns:minmax(0,1fr);max-width:440px;margin-inline:auto}

.cr-reference .cr-cover p.cr-cover-description{font-size:16px!important;line-height:1.8}

/* Larger cover overview with a dedicated heading and centered body below. */
.cr-reference .cr-cover-panels{max-width:570px;width:100%;margin-inline:auto}
.cr-reference .cr-cover-contracts{height:290px;border-radius:20px;padding:24px;display:block}
.cr-reference .cr-cover-contracts h2{font-size:20px;line-height:28px;margin:0 0 24px;text-align:center}
.cr-reference .cr-cover-contracts h2 small{font-size:16px}
.cr-reference .cr-cover-contracts dl{position:absolute;left:24px;top:164px;transform:translateY(-50%);width:55%;font-size:16px;line-height:23px;margin:0}
.cr-reference .cr-cover-contracts dl>div{margin-bottom:5px}
.cr-reference .cr-cover-contracts .cr-paid-row{margin-top:18px}
.cr-reference .cr-cover-contracts .cr-donut{width:176px;height:176px;right:20px;top:164px;transform:translateY(-50%)}

.cr-reference .cr-cover-contracts dl{left:34px;width:45%}
.cr-reference .cr-cover-contracts .cr-donut{width:148px;height:148px;right:32px}
.cr-reference .cr-cover-contracts h2{font-weight:400}
.cr-reference .cr-cover-contracts h2>strong{font-weight:700}
.cr-reference .cr-cover-contracts h2>small{font-weight:400;margin-left:2px}

.cr-reference .cr-cover-contracts dl{left:34px;width:220px}
.cr-reference .cr-cover-contracts dl>div{display:grid;grid-template-columns:78px minmax(0,1fr);column-gap:12px}
.cr-reference .cr-cover-contracts dd{text-align:right}
.cr-reference .cr-cover-contracts .cr-donut{left:280px;right:auto}

.cr-reference .cr-cover-contracts dl{width:190px}.cr-reference .cr-cover-contracts dl>div{grid-template-columns:68px minmax(0,1fr);column-gap:8px}.cr-reference .cr-cover-contracts .cr-donut{left:244px}

.cr-reference .cr-cover-contracts .cr-donut{width:160px;height:160px;left:280px;right:auto}

.cr-reference .cr-cover .cr-cover-contracts h2,.cr-reference .cr-cover .cr-cover-contracts h2 strong,.cr-reference .cr-cover .cr-cover-contracts h2 small,.cr-reference .cr-cover .cr-cover-contracts dl,.cr-reference .cr-cover .cr-cover-contracts dt,.cr-reference .cr-cover .cr-cover-contracts dd{font-size:16px}

.cr-reference .cr-cover .cr-cover-bottom table th,.cr-reference .cr-cover .cr-cover-bottom table td{font-size:15px;font-weight:400}

.cr-reference .cr-cover-contracts dl{width:206px}.cr-reference .cr-cover-contracts dl>div{grid-template-columns:80px minmax(0,1fr);column-gap:8px}.cr-reference .cr-cover-contracts dt,.cr-reference .cr-cover-contracts dd{white-space:nowrap;word-break:keep-all}

.cr-reference .cr-cover .cr-cover-contracts h2 strong{font-size:18px}

.cr-reference .cr-cover .cr-cover-contracts{border:1px solid rgba(148,163,184,.35);background:rgba(255,255,255,.72);box-shadow:none}

/* Cover composition: one centered overview followed by balanced artwork/contact columns. */
.cr-reference .cr-cover-panels{max-width:570px;margin:28px auto 0}
.cr-reference .cr-cover-contracts{height:248px;padding:0}
.cr-reference .cr-cover-contracts h2{margin:0;line-height:28px;text-align:center}
.cr-reference .cr-cover-contracts dl{left:58px;top:142px;width:206px;transform:translateY(-50%)}
.cr-reference .cr-cover-contracts .cr-donut{left:318px;top:142px;width:160px;height:160px;transform:translateY(-50%)}
.cr-reference .cr-cover-bottom{position:static;display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:30px;align-items:center;margin:36px 0 0}
.cr-reference .cr-cover-bottom>.cr-cover-hero{height:240px;display:flex;align-items:center;justify-content:center}
.cr-reference .cr-cover-bottom>.cr-cover-hero img{width:100%;height:240px;object-fit:contain;margin:0}
.cr-reference .cr-cover-bottom>table{width:330px;margin:0}



.cr-reference .cr-cover-bottom{position:absolute;bottom:65px;left:38px;right:38px;display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:20px;align-items:center;margin:0}
.cr-reference .cr-cover-bottom>table{width:350px;margin:0}
.cr-reference .cr-cover-bottom>.cr-cover-hero,.cr-reference .cr-cover-bottom>.cr-cover-hero img{height:185px}
.cr-reference .cr-cover-bottom th,.cr-reference .cr-cover-bottom td{height:35px}

[data-cover-movable=true]{position:relative;user-select:none;outline:1px dashed transparent;outline-offset:5px}
[data-cover-movable=true]:hover,[data-cover-movable=true]:focus-within{outline-color:#b7c8de}
[data-cover-movable=true] img{pointer-events:none;user-select:none;-webkit-user-drag:none}
.cr-book [data-cover-movable=true]>.cr-cover-resize{position:absolute;bottom:-10px;right:-10px;width:24px;height:24px;min-width:24px;padding:0;border:1px solid #dce5f0;border-radius:5px;background:white;color:#64748b;display:flex;align-items:center;justify-content:center;cursor:nwse-resize;touch-action:none;opacity:0;z-index:8}
[data-cover-movable=true]:hover>.cr-cover-resize,[data-cover-movable=true]:focus-within>.cr-cover-resize{opacity:1}
@media(hover:none){.cr-book [data-cover-movable=true]>.cr-cover-resize{opacity:1}}
@media print{.cr-cover-resize{display:none!important}[data-cover-movable=true]{outline:0!important}}

[data-cover-movable=true] :is(section,dl,dt,dd,h2,svg){touch-action:none;cursor:move}
.cr-book [data-cover-movable=true]>.cr-cover-move{position:absolute;top:0;left:0;width:28px;height:28px;min-width:28px;padding:0;border:0;background:transparent;color:#94a3b8;cursor:move;touch-action:none;display:flex;align-items:center;justify-content:center;z-index:9}
.cr-book [data-cover-movable=true]>.cr-cover-move:hover{color:#334155}
@media print{.cr-cover-move{display:none!important}}

/* Photo cover: keep report copy legible while the scene fills the middle. */
.cr-reference .cr-cover-photographic{isolation:isolate;background:#f8f8f6}
.cr-reference .cr-cover-photographic>.cr-cover-photo{position:absolute;inset:0;width:794px;height:1123px;margin:0;z-index:-2;pointer-events:none}
.cr-reference .cr-cover-photo>img{display:block;width:100%;height:100%;max-width:none;object-fit:cover}
.cr-reference .cr-cover-photo[data-background="yellow-care"]>img{transform:translateY(95px)}
.cr-cover-photo-wash{position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,1) 0%,rgba(255,255,255,.98) 18%,rgba(255,255,255,.9) 30%,rgba(255,255,255,.62) 43%,rgba(255,255,255,.18) 58%,rgba(255,255,255,0) 70%,rgba(255,255,255,0) 77%,rgba(255,255,255,.4) 100%)}
.cr-reference .cr-cover-photographic>.cr-cover-bottom{display:flex;justify-content:flex-end}
.cr-reference .cr-cover-photographic .cr-cover-bottom>table{width:350px;max-width:100%;table-layout:fixed;background:rgba(255,255,255,.94)}
.cr-reference .cr-cover-photographic .cr-cover-bottom>table th{width:105px;white-space:nowrap}
.cr-reference .cr-cover-photographic .cr-cover-bottom>table td{overflow-wrap:anywhere;word-break:break-word}
.cr-reference .cr-cover-photographic>.cr-set-footer{background:transparent}

/* Overview uses shared grid alignment instead of independent absolute offsets. */
.cr-reference .cr-cover .cr-cover-contracts{height:264px;border-radius:24px;padding:20px 36px;display:grid;grid-template-columns:minmax(0,1fr) 160px;grid-template-rows:28px minmax(0,1fr);column-gap:36px;row-gap:12px;align-items:center}
.cr-reference .cr-cover .cr-cover-contracts h2{grid-column:1/-1;margin:0;line-height:28px;align-self:center;text-align:center}
.cr-reference .cr-cover .cr-cover-contracts dl{position:static;left:auto;top:auto;transform:none;width:100%;max-width:226px;margin:0;justify-self:center;align-self:center}
.cr-reference .cr-cover .cr-cover-contracts dl>div{grid-template-columns:80px minmax(0,1fr);column-gap:12px;margin-bottom:5px}
.cr-reference .cr-cover .cr-cover-contracts dl>div:last-child{margin-bottom:0}
.cr-reference .cr-cover .cr-cover-contracts .cr-donut{position:static;left:auto;right:auto;top:auto;transform:none;width:160px;height:160px;margin:0;align-self:center;justify-self:center}

.cr-reference .cr-cover>.cr-coverage-radar{position:absolute;right:38px;bottom:254px;width:350px;padding:14px 8px 12px;border:1px solid rgba(148,163,184,.35);border-radius:24px;background:rgba(255,255,255,.8)}
.cr-coverage-radar h2{margin:0;text-align:center;font-size:15px;line-height:24px;font-weight:600;color:var(--cr-secondary)}
.cr-coverage-radar svg{display:block;width:100%;height:auto;overflow:visible}
.cr-coverage-radar p{margin:0;text-align:center;font-size:11px;line-height:16px;color:#64748b}

.cr-reference .cr-cover>.cr-coverage-radar{width:280px;padding:0;border:0;border-radius:0;background:transparent}

.cr-reference .cr-cover-dashboard{display:grid;width:100%;max-width:none;grid-template-columns:minmax(0,1fr) 280px;gap:12px;align-items:stretch;margin:28px 0 0}
.cr-reference .cr-cover-dashboard>.cr-cover-panels{display:block;width:100%;min-width:0;max-width:none;margin:0}
.cr-reference .cr-cover-dashboard .cr-cover-contracts{width:100%;min-width:0;max-width:none}
.cr-reference .cr-cover-dashboard .cr-cover-contracts{grid-template-columns:minmax(0,1fr) 136px;padding-inline:22px;column-gap:12px}
.cr-reference .cr-cover-dashboard .cr-cover-contracts .cr-donut{width:136px;height:136px;transform:translateX(-6px)}
.cr-reference .cr-cover-dashboard>.cr-coverage-radar{position:static;width:280px;height:264px;padding:0;border:1px solid rgba(148,163,184,.35);border-radius:24px;background:rgba(255,255,255,.72);display:flex;align-items:center;justify-content:center}
.cr-reference .cr-cover-dashboard>.cr-coverage-radar svg{width:250px;height:224px}

.cr-reference .cr-cover-dashboard{position:absolute;left:38px;right:38px;top:50%;width:auto;height:264px;margin:0;transform:translateY(-50%);align-items:stretch}
.cr-reference .cr-cover-dashboard>.cr-cover-panels{height:264px;transform:none;margin:0;align-self:stretch}
.cr-reference .cr-cover-dashboard .cr-cover-contracts,.cr-reference .cr-cover-dashboard>.cr-coverage-radar{box-sizing:border-box;height:264px;min-height:264px;max-height:264px;margin-block:0;align-self:stretch}

.cr-reference .cr-cover-dashboard>.cr-coverage-radar svg{transform:none}
.cr-reference .cr-cover-dashboard .cr-cover-contracts dl{transform:translateY(-20px)}
.cr-reference .cr-cover-dashboard .cr-cover-contracts .cr-donut{transform:translate(-6px,-20px)}

/* Center the complete overview, including its heading, within the card. */
.cr-reference .cr-cover-dashboard .cr-cover-contracts{grid-template-rows:28px auto;align-content:center;justify-content:center;row-gap:16px;padding:20px 22px}
.cr-reference .cr-cover-dashboard .cr-cover-contracts dl{transform:none;justify-self:center;align-self:center}
.cr-reference .cr-cover-dashboard .cr-cover-contracts .cr-donut{transform:none;justify-self:center;align-self:center}
.cr-reference .cr-cover-dashboard>.cr-coverage-radar{align-items:center;justify-content:center}
.cr-reference .cr-cover-dashboard>.cr-coverage-radar svg{transform:none;margin:0}
.cr-reference .cr-cover-dashboard .cr-cover-contracts h2{transform:translateY(-8px)}
.cr-reference .cr-cover-dashboard .cr-cover-contracts h2>strong{font-weight:800}
.cr-reference .cr-cover-name{padding-left:8px}

.cr-reference .cr-cover-name strong,.cr-reference .cr-cover .cr-cover-contracts h2>strong{color:var(--cr-name,#243f60)}

/* Footer contrast follows the actual light/dark areas of each cover image. */
.cr-reference .cr-cover-photographic>.cr-set-footer{color:#1e293b;text-shadow:0 1px 2px rgba(255,255,255,.75)}
.cr-reference .cr-cover-photographic:has(>.cr-cover-photo[data-background="home-photo"])>.cr-set-footer>span:first-child{color:#fff;text-shadow:0 1px 3px rgba(15,23,42,.95),0 0 2px rgba(15,23,42,.7)}
.cr-reference .cr-cover p.cr-cover-description{color:#475569}

.cr-reference .cr-card>h2,.cr-reference .cr-card:nth-child(2n)>h2{background:var(--cr-soft)}

.cr-reference .cr-comparison .cr-compare-table th,.cr-reference .cr-comparison .cr-compare-table td{text-align:center;vertical-align:middle;padding-inline:6px}
.cr-reference .cr-comparison-hero>div{text-align:center}
.cr-reference .cr-comparison-foot{display:grid;grid-template-columns:1.3fr 1fr 24px 1fr 1.2fr;gap:12px;text-align:center;align-items:center}

.cr-reference .cr-comparison-hero span{font-size:15px;line-height:22px}

.cr-reference .cr-remodel-summary .cr-contract-total{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:stretch;min-height:64px;margin:0 0 16px;padding:0;font-size:15px}
.cr-reference .cr-remodel-summary .cr-contract-total span{display:flex;align-items:center;justify-content:center;min-width:0;padding:12px 8px;font-size:15px;line-height:22px;text-align:center}
.cr-reference .cr-remodel-summary .cr-contract-total strong{display:flex;align-items:center;justify-content:center;padding:12px 10px;font-size:16px;line-height:22px;white-space:nowrap}
.cr-reference .cr-remodel-summary .cr-savings{padding:18px 14px;margin-top:24px}
.cr-reference .cr-remodel-summary .cr-savings p{font-size:16px;line-height:32px;margin:5px 0}
.cr-reference .cr-remodel-summary .cr-savings strong{font-size:24px;margin:0 8px;white-space:nowrap}
.cr-reference .cr-remodel-summary .cr-summary-columns th,.cr-reference .cr-remodel-summary .cr-summary-columns td{height:56px;padding:6px}

.cr-reference .cr-comparison-foot{grid-template-columns:1.15fr 1.2fr 20px 1.2fr 1.4fr;gap:10px;padding:20px 12px;font-size:15px;line-height:24px}
.cr-reference .cr-comparison-foot b,.cr-reference .cr-comparison-foot strong{font-size:20px;line-height:28px;white-space:normal;overflow-wrap:normal;word-break:keep-all}

.cr-reference .coverage-report-page .cr-set-footer{font-size:13px;line-height:18px}

.cr-reference .cr-remodel-summary .cr-contract-total{grid-template-columns:minmax(0,1fr) minmax(124px,42%)}
.cr-reference .cr-remodel-summary .cr-contract-total strong{min-width:0;padding-inline:8px;white-space:nowrap}

.cr-reference .cr-remodel-summary .cr-contract-text{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden;line-height:16px;max-height:48px;overflow-wrap:anywhere;white-space:normal}

.cr-reference .cr-comparison-arrow{display:flex;align-items:center;justify-content:center;color:var(--cr-secondary)}
.cr-reference .cr-comparison-arrow svg{display:block;flex-shrink:0}

.cr-reference .cr-comparison-foot strong{font-size:15px;line-height:24px;font-weight:400}

`;

export async function printCoverageReport(html: string, title: string) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;width:1px;height:1px;left:-9999px;top:0;border:0";
  frame.title = "보장분석표 인쇄";
  document.body.appendChild(frame);
  try {
    const doc = frame.contentDocument;
    if (!doc) throw new Error("인쇄 창을 열지 못했습니다");
    doc.open();
    // html is React-rendered report markup; the title uses textContent below.
    doc.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title></title><style>${REPORT_CSS}</style></head><body>${html}</body></html>`);
    doc.close();
    doc.title = title;
    await doc.fonts.ready;
    await Promise.all(Array.from(doc.images).map(image=>image.decode()));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const win = frame.contentWindow;
    if (!win) throw new Error("인쇄 창을 열지 못했습니다");
    win.addEventListener("afterprint", () => frame.remove(), { once: true });
    win.focus();
    win.print();
    // Some mobile browsers do not dispatch afterprint.
    window.setTimeout(() => frame.remove(), 300_000);
  } catch (error) { frame.remove(); throw error; }
}

 
