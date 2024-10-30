// Configurações do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyARY7B2quitKNNPP1tDIHsMhpC_spStFbY",
    authDomain: "agenda-f2287.firebaseapp.com",
    projectId: "agenda-f2287",
    storageBucket: "agenda-f2287.appspot.com",
    messagingSenderId: "786170238662",
    appId: "1:786170238662:web:769e1b44c5c467e3a429c7",
    measurementId: "G-REL6C7GH76"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const diasSemana = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA'];
const horarios = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Armazenar as reuniões agendadas
let agendamentos = {};

// Referência à coleção de agendamentos no Firestore
const agendamentosRef = db.collection("agendamentos");

// Função para carregar agendamentos do Firestore em tempo real
function carregarAgendamentos() {
    agendamentosRef.onSnapshot((snapshot) => {
        agendamentos = {}; // Limpa os agendamentos locais
        snapshot.forEach((doc) => {
            agendamentos[doc.data().chave] = doc.data(); // Armazena cada agendamento pelo ID
        });
        const filtroAtual = document.getElementById('filtro-agendamentos').value; // Captura o filtro atual
        gerarSemana(filtroAtual); // Regera a interface com os dados atualizados
    });
}
carregarAgendamentos(); // Chama a função ao iniciar

// Filtro para escolher entre HOJE e TODOS
const filtroDiv = document.createElement('div');
filtroDiv.id = 'filtro';
filtroDiv.innerHTML = `
    <label for="filtro-agendamentos">Filtrar Agenda:</label>
    <select id="filtro-agendamentos">
        <option value="TODOS">TODOS</option>
        <option value="HOJE">HOJE</option>
    </select>
`;
document.body.insertBefore(filtroDiv, document.getElementById('diasSemana'));

// Evento para o filtro
document.getElementById('filtro-agendamentos').addEventListener('change', (event) => {
    const filtroSelecionado = event.target.value;
    localStorage.setItem('filtroSelecionado', filtroSelecionado); // Salva a seleção no localStorage
    gerarSemana(filtroSelecionado);
});

// Definindo primeiro `isMobile` para verificar o tipo de dispositivo
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Carrega o filtro do localStorage ou aplica o padrão
document.addEventListener('DOMContentLoaded', () => {
    const filtroSalvo = localStorage.getItem('filtroSelecionado');
    const filtroInicial = filtroSalvo || (isMobile ? 'HOJE' : 'TODOS');

    document.getElementById('filtro-agendamentos').value = filtroInicial;
    gerarSemana(filtroInicial); // Gera a semana com o filtro inicial

    // Carrega os agendamentos em tempo real
    carregarAgendamentos(); // Chama a função ao iniciar
});

// Função para alternar o tema
function toggleTheme() {
    const checkbox = document.getElementById('checkbox');
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        checkbox.checked = false;
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        checkbox.checked = true;
    }
}

// Verificar tema ao carregar a página
function checkTheme() {
    const checkbox = document.getElementById('checkbox');
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        checkbox.checked = true;
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        checkbox.checked = false;
    }
}

document.getElementById('checkbox').addEventListener('change', toggleTheme);
document.addEventListener('DOMContentLoaded', checkTheme);

// Função para verificar se um horário já passou
function isHoraPassada(horario) {
    const [hora, minuto] = horario.split(':').map(Number);
    const agora = new Date();

    if (agora.getHours() > hora) return true; // Hora já passou
    if (agora.getHours() === hora && agora.getMinutes() >= 6000) return true;

    return false; // Horário ainda disponível
}

// Gerar os dias da semana com base no filtro
function gerarSemana(filtro = 'TODOS') {
    const diasDiv = document.getElementById('diasSemana');
    diasDiv.innerHTML = '';

    const dataAtual = new Date();
    const diaAtual = dataAtual.getDay();
    const ajustarDias = (diaAtual === 6) ? 1 : (diaAtual === 0) ? 1 : 0;

    for (let i = 1; i <= 5; i++) {
        const dia = document.createElement('div');
        dia.className = 'dia';

        const dataDia = new Date();
        dataDia.setDate(dataAtual.getDate() - diaAtual + i + (ajustarDias * 7));

        // Verifica se o filtro é 'HOJE'
        if (filtro === 'HOJE' && dataDia.toDateString() !== dataAtual.toDateString()) {
            continue; // Se não for hoje, pula este dia
        }

        const ehPassado = dataDia < dataAtual;

        dia.innerHTML = `
            <div class="dia-semana">${diasSemana[i - 1]}</div>
            <div class="dia-data">${dataDia.getDate()}/${dataDia.getMonth() + 1}</div>
        `;

        horarios.forEach(horario => {
            const horaDiv = document.createElement('div');
            let status = 'available';

            // Verifica se o horário é passado
            if (ehPassado || (dataDia.toDateString() === dataAtual.toDateString() && isHoraPassada(horario))) {
                status = 'past'; // Se o horário é passado, muda o status
            }

            const agendamentoChave = `${diasSemana[i - 1]}_${horario}`;
            if (agendamentos[agendamentoChave]) {
                // Se o horário é ocupado
                if (status === 'past') {
                    status = 'past-occupied'; // Define como past-occupied
                } else {
                    status = 'occupied';
                }
                const { nome, assunto } = agendamentos[agendamentoChave];
                horaDiv.innerHTML = `<span class="horario-hora">${horario}</span> <span class="horario-nome-assunto"><strong>Nome:</strong> ${nome} <br> <strong>Assunto:</strong> ${assunto}</span>`;
            } else {
                horaDiv.innerText = horario; // Exibe o horário
            }

            horaDiv.className = `horario ${status}`;

            if (status === 'available') {
                horaDiv.onclick = function() {
                    abrirModal(horario, diasSemana[i - 1]);
                };
            } else if (status === 'occupied') {
                horaDiv.onclick = function() {
                    cancelarAgendamento(agendamentoChave);
                };
            }

            dia.appendChild(horaDiv);
        });

        diasDiv.appendChild(dia);
    }
}

// Função para abrir o modal de agendamento e salvar no Firestore
function abrirModal(horario, diaSemana) {
    let nome = '';
    let assunto = '';
    while (nome.trim() === '') {
        nome = prompt(`Agendamento de horário: ${horario} - ${diaSemana} \nDigite seu nome (máximo 16 caracteres):`);
        if (nome === null) return; // Cancelar se o usuário pressionar "Cancelar"
        if (nome.trim() === '') alert('Por favor, digite um nome válido.');
        if (nome.length > 20) {
            nome = nome.substring(0, 20); // Mantém apenas os primeiros 20 caracteres
        }
    }

    while (assunto.trim() === '') {
        assunto = prompt(`Digite o assunto:`);
        if (assunto === null) return; // Cancelar se o usuário pressionar "Cancelar"
        if (assunto.trim() === '') alert('Por favor, digite um assunto válido.');
    }

    nome = nome.toUpperCase();
    assunto = assunto.toUpperCase();
    
    const agendamentoChave = `${diaSemana}_${horario}`;

    agendamentosRef.add({
        chave: agendamentoChave,
        nome,
        assunto,
        horario,
        diaSemana
    }).then(() => {
        alert('Agendamento realizado com sucesso!');
        gerarSemana(document.getElementById('filtro-agendamentos').value); // Mantém o filtro atual
    }).catch(error => {
        alert('Erro ao agendar, tente novamente.');
    });
}

// Função para cancelar o agendamento no Firestore
function cancelarAgendamento(agendamentoChave) {
    const agendamento = agendamentos[agendamentoChave];
    if (confirm(`Deseja cancelar o agendamento de ${agendamento.nome}?\nAssunto: ${agendamento.assunto}`)) {
        agendamentosRef.where("chave", "==", agendamentoChave).get().then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.delete().then(() => {
                    alert('Agendamento cancelado com sucesso!');
                    gerarSemana(document.getElementById('filtro-agendamentos').value); // Mantém o filtro atual
                }).catch(error => {
                    alert('Erro ao cancelar, tente novamente.');
                });
            });
        }).catch(error => {
            alert('Erro ao cancelar, tente novamente.');
        });
    }
}

// Função para atualizar horários passados em tempo real
function verificarHorariosPassados() {
    const filtroSelecionado = document.getElementById('filtro-agendamentos').value;
    gerarSemana(filtroSelecionado); // Atualiza a interface com o filtro atual
}

// Verifica a cada minuto se algum horário passou, automatizando a atualização
setInterval(verificarHorariosPassados, 60000);


