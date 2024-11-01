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
    if (agora.getHours() === hora && agora.getMinutes() >= 5975) return true;
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
                // Passar a data correta
                horaDiv.onclick = function() {
                    abrirModal(horario, diasSemana[i - 1], dataDia); // Adicionando dataDia
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
async function abrirModal(horario, diaSemana, dataDia) {    
    // Define o CSS para o título da modal
    const customStyles = `
        <style>
            .swal2-title {
                font-size: 20px; /* Tamanho do texto do título */
                font-weight: bold; /* Peso do texto do título */
            }
            .swal2-confirm {
                background-color: green; /* Cor de fundo do botão OK */
                color: white; /* Cor do texto do botão OK */
                border: 2px solid green; /* Borda verde */
                border-radius: 5px; /* Borda arredondada */
            }
            .swal2-cancel {
                background-color: red; /* Cor de fundo do botão Cancelar */
                color: white; /* Cor do texto do botão Cancelar */
                border: 2px solid red; /* Borda vermelha */
                border-radius: 5px; /* Borda arredondada */
            }
            .swal2-popup {
                border-radius: 10px; /* Borda arredondada da popup */
            }
        </style>
    `;
    const dia = `${dataDia.getDate()}/${dataDia.getMonth() + 1}/${dataDia.getFullYear()}`;
    // Exibe o input para o nome do usuário usando SweetAlert
    const { value: nome } = await Swal.fire({
        title: `Agendamento de horário<br>${diaSemana} (${dia}) - ${horario}`,
        input: 'text',
        inputLabel: 'Olá, digite seu nome (máximo 16 caracteres):',
        inputValue: '',
        showCancelButton: true, // Adiciona o botão de cancelar
        cancelButtonText: 'Cancelar', // Texto do botão de cancelar
        backdrop: 'static', // evita que a tela balance
        allowOutsideClick: false, // impede o clique fora do modal
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return 'Por favor, digite um nome válido.';
            }
            if (value.length > 16) {
                return 'O nome deve ter no máximo 16 caracteres.';
            }
        },
        // Adiciona o estilo customizado na modal
        willOpen: () => {
            Swal.getHtmlContainer().insertAdjacentHTML('afterbegin', customStyles);
        }        
    });

    if (!nome) return; // Cancela se o usuário pressionar "Cancelar"

  // Função para capitalizar a primeira letra de cada palavra
function capitalizeEachWord(nome) {
    return nome
        .toLowerCase() // Primeiro, converte tudo para minúsculas
        .split(' ') // Divide o nome em palavras
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitaliza a primeira letra de cada palavra
        .join(' '); // Junta as palavras de volta em uma string
}

    // Exibe o input para o assunto, com o mesmo texto da primeira modal
    const { value: assunto } = await Swal.fire({
        title: `Agendamento de horário<br>${diaSemana} (${dia}) - ${horario}`, // Mantém o título igual
        backdrop: 'static', // evita que a tela balance
        allowOutsideClick: false, // impede o clique fora do modal
        input: 'text',
        inputLabel: `${capitalizeEachWord(nome)} digite o assunto:`, // Exibe o nome com a primeira letra maiúscula
        inputValue: '',
        showCancelButton: true, // Adiciona o botão de cancelar
        cancelButtonText: 'Cancelar', // Texto do botão de cancelar
        customClass: {
            confirmButton: 'swal2-confirm', // Aplica a classe de confirmação
            cancelButton: 'swal2-cancel' // Aplica a classe de cancelamento
        },
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return '${agendamento.nome} por favor, digite um assunto válido.';
            }
        },
        // Adiciona o estilo customizado na modal
        willOpen: () => {
            Swal.getHtmlContainer().insertAdjacentHTML('afterbegin', customStyles);
        }
    });

    if (!assunto) return; // Cancela se o usuário pressionar "Cancelar"

    // Converte valores para maiúsculas
    const nomeUpper = nome.toUpperCase();
    const assuntoUpper = assunto.toUpperCase();

    const agendamentoChave = `${diaSemana}_${horario}`;

    // Salva o agendamento no Firestore
    agendamentosRef.add({
        chave: agendamentoChave,
        nome: nomeUpper,
        assunto: assuntoUpper,
        horario,
        diaSemana
    }).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Agendamento Realizado!',
            html: `Por favor, siga as seguintes instruções:<br>
            1. Caso não compareça, cancele o agendamento para que outros possam visualizar.<br>
            2. Durante o uso da sala, vire a placa para "OCUPADO". Ao sair, vire novamente para "LIVRE".<br>
            3. Ao término da reunião, reorganize a sala, desligue o ar-condicionado e as luzes para que esteja pronta para o próximo usuário.<br><br>
            <b>Agradecemos a colaboração!</b>`,
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'swal2-confirm' // Aplica a classe ao botão OK
            },
            willOpen: () => {
                Swal.getHtmlContainer().insertAdjacentHTML('afterbegin', customStyles);
            }
        });
        gerarSemana(document.getElementById('filtro-agendamentos').value); // Atualiza a visualização
    }).catch(error => {
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Erro ao agendar, tente novamente.'
        });
    });
}

// Função para cancelar o agendamento no Firestore
async function cancelarAgendamento(agendamentoChave) {
    const agendamento = agendamentos[agendamentoChave];
    
  // Função para capitalizar a primeira letra de cada palavra
  function capitalizeEachWord(nome) {
    return nome
        .toLowerCase() // Primeiro, converte tudo para minúsculas
        .split(' ') // Divide o nome em palavras
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitaliza a primeira letra de cada palavra
        .join(' '); // Junta as palavras de volta em uma string
}

    // Define o CSS customizado para o modal de confirmação
    const customStyles = `
        <style>
            .swal2-title {
                font-size: 20px;
                font-weight: bold;
            }
            .swal2-confirm {
                background-color: green;
                color: white;
                border: 2px solid green;
                border-radius: 5px;
            }
            .swal2-cancel {
                background-color: red;
                color: white;
                border: 2px solid red;
                border-radius: 5px;
            }
            .swal2-popup {
                border-radius: 10px;
            }
            /* Estilo para INFORMAÇÕES DE AGENDAMENTO */
            .info-agendamento {
                font-size: 14px;
                font-weight: normal;
            }
            /* Estilo para ATENÇÃO */
            .alerta-atencao {
                color: red;
                font-weight: bold;
            }
            /* Estilo para o texto de aviso */
            .texto-aviso {
                font-size: 12px; /* Tamanho menor para o texto */
                font-style: italic; /* Texto em itálico */
                color: #333; /* Cor opcional para suavizar */
            }
        </style>
    `;
    // Exibe um modal de confirmação com SweetAlert
    const result = await Swal.fire({
        title: `Deseja realmente cancelar?<br><br><span class="info-agendamento"><strong>INFORMAÇÕES DE AGENDAMENTO</strong><br>Agendado por: ${capitalizeEachWord(agendamento.nome)}<br>Assunto: ${agendamento.assunto}</span>`,
        html: `<span class="alerta-atencao">ATENÇÃO</span><br><span class="texto-aviso">O cancelamento da reunião configura que a sala está livre para uso/agendamento.<br>Você não poderá desfazer essa ação!</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, cancelar',
        cancelButtonText: 'Não, voltar',
        customClass: {
            confirmButton: 'swal2-confirm',
            cancelButton: 'swal2-cancel'
        },
        willOpen: () => {
            Swal.getHtmlContainer().insertAdjacentHTML('afterbegin', customStyles);
        }
    });

    // Se o usuário confirmou, prossegue com o cancelamento
    if (result.isConfirmed) {
        try {
            const snapshot = await agendamentosRef.where("chave", "==", agendamentoChave).get();
            snapshot.forEach(doc => {
                doc.ref.delete();
            });
            Swal.fire({
                icon: 'success',
                title: 'Agendamento cancelado!',
                html: `Agendamento cancelado com sucesso!<br><br>
                Por favor, siga as seguintes instruções:<br>
                1. Se estiver cancelando no local, reorganize a sala, desligue o ar-condicionado e as luzes para que esteja pronta para o próximo usuário.<br>
                2. Durante o uso da sala, vire a placa para "OCUPADO". Ao sair, vire novamente para "LIVRE".<br>
                <b>Agradecemos a colaboração!</b>`,
                confirmButtonText: 'OK',
                customClass: {
                    confirmButton: 'swal2-confirm'
                },
                willOpen: () => {
                    Swal.getHtmlContainer().insertAdjacentHTML('afterbegin', customStyles);
                }
            });
            gerarSemana(document.getElementById('filtro-agendamentos').value); // Atualiza a visualização
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: 'Erro ao cancelar o agendamento, tente novamente.',
                customClass: {
                    confirmButton: 'swal2-confirm'
                }
            });
        }
    }
}

// Função para atualizar horários passados em tempo real
function verificarHorariosPassados() {
    const filtroSelecionado = document.getElementById('filtro-agendamentos').value;
    gerarSemana(filtroSelecionado); // Atualiza a interface com o filtro atual
}
// Verifica a cada minuto se algum horário passou, automatizando a atualização
setInterval(verificarHorariosPassados, 60000);