const payload = {
    action: 'save_append',
    droneId: 'JU32636BA3D2',
    date: '2026年05月',
    filename: 'test_data_only.json',
    prefix: '飛行日誌',
    fileData: '',
    fieldValues: { "test": "123" }
};

fetch('https://script.google.com/macros/s/AKfycbysGawyBydG7mg0XXl5PPLxv03a6DDzKwLtDR5qcizp8egT_qAkrTLg3psHYnN98PtZDQ/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
})
.then(res => res.json())
.then(result => console.log(result))
.catch(err => console.error(err));
