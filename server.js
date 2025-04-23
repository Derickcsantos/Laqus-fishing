require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Recebe dados do cliente e envia por e-mail
app.post('/dados-cliente', async (req, res) => {
  try {
    const dados = req.body;

    const corpoEmail = `
📌 DADOS DA MÁQUINA DO CLIENTE

🌍 IP Público: ${dados.ipPublico || 'N/D'}
🧭 Navegador: ${dados.navegador || 'N/D'}
💻 Plataforma: ${dados.plataforma || 'N/D'}
🗣️ Idioma: ${dados.idioma || 'N/D'}
🖥️ Resolução da Tela: ${dados.resolucao || 'N/D'}
🔋 Nível de Bateria: ${dados.bateria || 'N/D'}
📶 Tipo de Conexão: ${dados.conexao || 'N/D'}
📅 Data e Hora Local: ${dados.dataHora || 'N/D'}
`.trim();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: '📬 Relatório da Máquina do Cliente',
      text: corpoEmail,
    });

    console.log('✅ Dados enviados por e-mail.');
    res.send('Dados enviados com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao enviar dados:', err);
    res.status(500).send('Erro ao enviar os dados.');
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
