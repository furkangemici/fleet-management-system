export const exportToCSV = (data, filename) => {
  if (!data || !data.length) {
    alert('Raporlanacak veri bulunamadı.');
    return;
  }

  // Sütun başlıklarını al (İlk objenin keyleri)
  const headers = Object.keys(data[0]);
  
  // CSV içeriğini oluştur (Noktalı virgül ile ayır - Excel uyumluluğu için)
  const csvRows = [
    headers.join(';'), // Başlık satırı
    ...data.map(row => 
      headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) val = '';
        
        // Tarih formatla (Eğer obje Date ise veya ISO string ise ve maplenmemişse)
        // Genellikle sayfalarda veri maplenerek gönderilecek ama güvenlik için:
        if (typeof val === 'object' && val instanceof Date) {
            val = val.toLocaleDateString('tr-TR');
        } else if (typeof val === 'string' && val.includes('T') && val.length > 20 && !isNaN(Date.parse(val))) {
             try {
                // Sadece geçerli ISO stringleri tarih yap
                const d = new Date(val);
                if(!isNaN(d.getTime())) val = d.toLocaleDateString('tr-TR');
             } catch(e) {}
        }

        const str = String(val);
        // İçerisinde ; veya yeni satır varsa tırnak içine al (Excel CSV standardı)
        return str.includes(';') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(';')
    )
  ];

  const csvContent = `\uFEFF${csvRows.join('\n')}`; // BOM ekle (Türkçe karakterler için şart)
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
