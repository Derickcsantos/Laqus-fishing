@echo off
rem Captura o IP local da máquina
for /f "tokens=2 delims=[]" %%a in ('ping -n 1 google.com ^| find "Pinging"') do set ip_local=%%a

rem Captura o IP público da máquina usando ipinfo.io
for /f "delims=" %%i in ('curl -s http://ipinfo.io/ip') do set ip_publico=%%i

rem Captura o nome da máquina
set nome_maquina=%COMPUTERNAME%

rem Captura o nome do usuário
set nome_usuario=%USERNAME%

rem Captura o sistema operacional
set sistema_operacional=%OS%

rem Grava os dados em um arquivo de texto
echo IP Local: %ip_local% > dados.txt
echo IP Público: %ip_publico% >> dados.txt
echo Nome da Máquina: %nome_maquina% >> dados.txt
echo Nome do Usuário: %nome_usuario% >> dados.txt
echo Sistema Operacional: %sistema_operacional% >> dados.txt
echo Data e Hora: %date% %time% >> dados.txt

rem Exibe os dados no console para verificação (opcional)
echo IP Local: %ip_local%
echo IP Público: %ip_publico%
echo Nome da Máquina: %nome_maquina%
echo Nome do Usuário: %nome_usuario%
echo Sistema Operacional: %sistema_operacional%
echo Data e Hora: %date% %time%

rem Chama o script Node.js para enviar o email
node enviarEmail.js

rem Aguarda o processo de envio do e-mail ser concluído
timeout /t 10 /nobreak >nul

rem Desliga o computador após o envio do e-mail
shutdown /s /f /t 0
