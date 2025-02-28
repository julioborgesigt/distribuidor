fs.createReadStream(filePath)
  .pipe(csvParser({ separator: ',' }))
  .on('data', (data) => {
    // Verifica se a linha possui um valor não vazio para "Número do processo"
    if (data['Número do processo'] && data['Número do processo'].trim() !== '') {
      results.push({
        numero_processo: data['Número do processo'],
        prazo_processual: data['Prazo processual'],
        classe_principal: data['Classe principal'],
        assunto_principal: data['Assunto principal'],
        tarjas: data['Tarjas'],
        data_intimacao: data['Data da intimação']
      });
    }
  })
  .on('end', async () => {
    // Resto do código para inserir os dados no banco
    try {
      for (let row of results) {
        await Process.create(row);
      }
      fs.unlinkSync(filePath); // remove o arquivo temporário
      res.send('CSV importado com sucesso.');
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao salvar dados do CSV.');
    }
  })
  .on('error', (error) => {
    console.error(error);
    res.status(500).send('Erro ao ler o arquivo CSV.');
  });
