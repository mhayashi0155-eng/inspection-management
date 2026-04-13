const payload = {
    action: 'get_latest',
    droneId: 'JU32636BA3D2',
    date: '2026年04月',
    filename: '飛行日誌_JU32636BA3D2_202604.pdf',
    prefix: '飛行日誌'
};

fetch('https://script.google.com/macros/s/AKfycbysGawyBydG7mg0XXl5PPLxv03a6DDzKwLtDR5qcizp8egT_qAkrTLg3psHYnN98PtZDQ/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
})
.then(res => res.json())
.then(result => {
    console.log(JSON.stringify({
        status: result.status,
        message: result.message || null,
        filename: result.filename || null,
        folder: result.folder || null,
        hasFileData: !!result.fileData,
        hasFieldValues: !!result.fieldValues,
        fieldValuesType: typeof result.fieldValues,
        fieldValuesPreview: result.fieldValues ? 
            (typeof result.fieldValues === 'string' ? 
                result.fieldValues.substring(0, 300) : 
                JSON.stringify(result.fieldValues).substring(0, 300)) 
            : null,
        allKeys: Object.keys(result)
    }, null, 2));
})
.catch(err => console.error(err));
