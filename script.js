if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(error) {
        console.log('ServiceWorker registration failed: ', error);
      });
    });
  }

// No início do seu arquivo JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Recupera a última tab selecionada do localStorage
    const lastSelectedTab = localStorage.getItem('lastSelectedTab');
    if (lastSelectedTab) {
        const tab = document.querySelector(lastSelectedTab);
        if (tab) {
            const bsTab = new bootstrap.Tab(tab);
            bsTab.show();
        }
    }
// Adicione este evento no início do seu arquivo, junto com os outros event listeners
document.addEventListener('click', function(e) {
    if (!e.target.classList.contains('horario') && !e.target.closest('.swal2-container')) {
    }
});
    // Adiciona listener para salvar a tab selecionada
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            localStorage.setItem('lastSelectedTab', `#${e.target.id}`);
        });
    });
});
// Variáveis globais para controlar estados de seleção e temporizadores de toque
let touchTimeout; // Armazena o timeout do evento de toque
let isTouchSelecting = false; // Flag para verificar se a seleção por toque está ativa
let selectedHorarios = []; // Array para armazenar horários selecionados
let isSelecting = false; // Flag para saber se a seleção está em andamento
let lastTouchedElement = null; // Último elemento tocado para comparação de seleção contínua
let isMouseDown = false; // Flag para saber se o botão do mouse está pressionado

// Função para inicializar eventos de toque e mouse em um elemento
function initializeEvents(horaDiv) {
    // Adiciona eventos para touch (mobile)
    horaDiv.addEventListener('touchstart', handleTouchStart, { passive: false });
    horaDiv.addEventListener('touchmove', handleTouchMove, { passive: false });
    horaDiv.addEventListener('touchend', handleTouchEnd);

    // Adiciona eventos para mouse (desktop)
    horaDiv.addEventListener('mousedown', handleMouseDown);
    horaDiv.addEventListener('mouseover', handleMouseOver);
    horaDiv.addEventListener('mouseup', handleMouseUp);
}

// Handlers de eventos para mouse (desktop)
function handleMouseDown(e) {
    if (!e.target.classList.contains('available')) return; // Verifica se o elemento está disponível para seleção

    isMouseDown = true; // Define que o mouse está pressionado
    isSelecting = true; // Inicia o modo de seleção
    const element = e.target;
    element.classList.add('selecting'); // Adiciona classe 'selecting' ao elemento
    toggleHorarioSelection(element, element.dataset.horario, element.dataset.diaSemana, new Date(element.dataset.dataDia));
}

function handleMouseOver(e) {
    if (!isMouseDown || !isSelecting) return; // Apenas executa se o mouse está pressionado e em modo de seleção

    const element = e.target;
    if (element.classList.contains('horario') && element.classList.contains('available')) {
        const currentDay = element.dataset.diaSemana;
        const firstDay = selectedHorarios[0]?.diaSemana;

        if (firstDay && currentDay !== firstDay) return; // Evita seleção de dias diferentes

        toggleHorarioSelection(element, element.dataset.horario, element.dataset.diaSemana, new Date(element.dataset.dataDia));
    }
}

function handleMouseUp() {
    if (isSelecting && selectedHorarios.length > 0) {
        abrirModal(selectedHorarios); // Abre um modal com horários selecionados se houver algum
    }
    isMouseDown = false; // Reseta o estado do mouse
    isSelecting = false; // Finaliza o modo de seleção
    document.querySelectorAll('.selecting').forEach(el => el.classList.remove('selecting')); // Remove classe 'selecting' de todos os elementos
    limparSelecao();
}

// Handlers de eventos para touch (mobile)
function handleTouchStart(e) {
    e.preventDefault(); // Prevê o comportamento padrão de toque
    const element = e.target;

    if (!element.classList.contains('available')) return; // Verifica se o elemento está disponível para seleção

    touchTimeout = setTimeout(() => {
        isTouchSelecting = true; // Inicia o modo de seleção por toque
        element.classList.add('selecting');
        toggleHorarioSelection(element, element.dataset.horario, element.dataset.diaSemana, new Date(element.dataset.dataDia));
    }, 500); // Espera 500ms para evitar seleção acidental

    lastTouchedElement = element; // Armazena o último elemento tocado
    limparSelecao();
}

function handleTouchMove(e) {
    if (!isTouchSelecting) return; // Apenas executa se o toque está selecionando

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.classList.contains('horario') && element.classList.contains('available') && element !== lastTouchedElement) {
        const currentDay = element.dataset.diaSemana;
        const firstDay = selectedHorarios[0]?.diaSemana;

        toggleHorarioSelection(element, element.dataset.horario, element.dataset.diaSemana, new Date(element.dataset.dataDia));
        lastTouchedElement = element; // Atualiza o último elemento tocado
    }
}

function handleTouchEnd() {
    clearTimeout(touchTimeout); // Cancela o timeout de toque
    if (isTouchSelecting && selectedHorarios.length > 0) {
        abrirModal(selectedHorarios); // Abre modal com horários selecionados
    }
    isTouchSelecting = false; // Reseta a seleção por toque
    document.querySelectorAll('.selecting').forEach(el => el.classList.remove('selecting')); // Remove classe 'selecting' de todos os elementos
}

// Função para limpar seleção de horários
function limparSelecao() {
    document.querySelectorAll('.horario.selecting').forEach(el => el.classList.remove('selecting')); // Remove a classe 'selecting'
    document.querySelectorAll('.horario.selected').forEach(el => {
        el.classList.remove('selected'); // Remove a classe 'selected'
        el.style.backgroundColor = ''; // Reseta o background
    });
    selectedHorarios = []; // Limpa o array de horários selecionados
}

// Função para alternar a seleção de horários
function toggleHorarioSelection(element, horario, diaSemana, dataDia) {
    if (element.classList.contains('occupied') || element.classList.contains('past')) return; // Ignora horários ocupados ou passados

    const index = selectedHorarios.findIndex(h => 
        h.horario === horario && h.diaSemana === diaSemana
    );

    if (index === -1) { // Adiciona o horário se não estiver selecionado
        selectedHorarios.push({ horario, diaSemana, dataDia });
        element.classList.add('selected'); // Marca o horário como selecionado
        element.style.backgroundColor = '#145912'; // Indica a seleção com uma cor verde clara
    } else { // Remove o horário se já estiver selecionado
        selectedHorarios.splice(index, 1);
        element.classList.remove('selected'); // Remove a marca de seleção
        element.style.backgroundColor = ''; // Remove o background
    }
}

async function atualizarDisponibilidadeSalas() {
    const salas = ['PARIPE', 'ILHÉUS', 'BAÍA DE TODOS OS SANTOS (DIRETORIA)'];
    const salasMobilesDisponiveis = document.getElementById('salasMobilesDisponiveis');

    // Limpa o conteúdo anterior
    salasMobilesDisponiveis.innerHTML = '';

    // Cria um array para armazenar as promises de verificação de disponibilidade
    const verificacoes = salas.map(async (sala) => {
        try {
            const agendamentosRef = db.collection(`agendamentos_${formatarIdSala(sala)}`);
            const hoje = new Date();
            const diaDaSemana = hoje.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
            const horaAtual = hoje.getHours();
            const minutosAtuais = hoje.getMinutes();
            const dataHoje = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;

            // Verifica se está fechado
            const estaFechado = (diaDaSemana === 0 || diaDaSemana === 6) || (horaAtual >= 18);

            // Busca agendamentos para hoje
            const snapshot = await agendamentosRef.where('data', '==', dataHoje).get();

            // Verifica a disponibilidade comparando os horários dos agendamentos com o horário atual
            const estaDisponivel = snapshot.empty || 
                snapshot.docs.every(doc => {
                    const horario = doc.data().horario;
                    return isHoraDisponivel(horario, horaAtual, minutosAtuais);
                });

            return { sala, disponivel: estaDisponivel, fechado: estaFechado };
        } catch (error) {
            console.error(`Erro ao verificar disponibilidade de ${sala}:`, error);
            return { sala, disponivel: false, fechado: true }; // Considera fechado se houver erro
        }
    });

    // Aguarda todas as verificações
    const disponibilidade = await Promise.all(verificacoes);

    // Cria o HTML com as salas e seus status
    const statusHTML = disponibilidade.map(({ sala, disponivel, fechado }) => {
        let corBolinha;
        if (fechado) {
            corBolinha = '🔒'; // Bolinha cinza para fechado
        } else if (!disponivel) {
            corBolinha = '⛔'; // Bolinha vermelha para ocupado
        } else {
            corBolinha = '🟢'; // Bolinha verde para disponível
        }
        return `${corBolinha} ${sala}`;
    }).join(' | ');

    // Atualiza o marquee
    salasMobilesDisponiveis.innerHTML = statusHTML;
}

// Função para verificar se o horário do agendamento já passou em relação ao horário atual
function isHoraDisponivel(horario, horaAtual, minutosAtuais) {
    const [horaAgendamento, minutosAgendamento] = horario.split(':').map(Number);

    // Retorna true se o horário atual for antes do horário de agendamento
    if (horaAgendamento > horaAtual) return true;
    if (horaAgendamento === horaAtual && minutosAgendamento > minutosAtuais) return true;
    // Retorna false se o horário atual já passou o horário de agendamento
    return false;
}

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

const urlParams = new URLSearchParams(window.location.search);
const salaSelecionada = urlParams.get('sala') || 'PARIPE'; // Define PARIPE como padrão caso o parâmetro sala não exista

document.getElementById('nomeSala').textContent = salaSelecionada.toLocaleUpperCase('pt-BR'); // Mantém o formato em maiúsculas

const themeSwitch = document.getElementById('checkbox');
const body = document.body;

themeSwitch.addEventListener('change', () => {
    if (themeSwitch.checked) {
        body.classList.add('dark');
        body.classList.remove('light');
    } else {
        body.classList.add('light');
        body.classList.remove('dark');
    }
});

// Função para transformar o nome da sala em ID
function formatarIdSala(sala) {
    return sala
        .normalize("NFD") // Normaliza a string para decompor caracteres acentuados
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\s/g, "") // Remove espaços
        .toUpperCase(); // Converte para maiúsculas
}

// Função para carregar agendamentos do Firestore em tempo real
function carregarAgendamentos() {
    const salaSelecionada = document.getElementById('nomeSala').textContent;
    const agendamentosRef = db.collection(`agendamentos_${formatarIdSala(salaSelecionada)}`);
// Use onSnapshot para ouvir mudanças em tempo real
    agendamentosRef.onSnapshot((snapshot) => {
        agendamentos = {}; // Limpa os agendamentos locais
        snapshot.forEach((doc) => {
            agendamentos[doc.id] = doc.data();
        });      
        gerarSemana();
        atualizarBadges();
        atualizarDisponibilidadeSalas();
    });
}
carregarAgendamentos(); // Chama a função ao iniciar

function verificarESabado() {
    const hoje = new Date();
    // Verifica se o dia da semana é sábado (6)
    if (hoje.getDay() === 6) {
        limparAgendamentosFirestore();
    }
}
// Função para limpar agendamentos do Firestore
async function limparAgendamentosFirestore() {
    const salas = ['PARIPE', 'ILHÉUS', 'BAÍA DE TODOS OS SANTOS (DIRETORIA)'];
    
    for (let sala of salas) {
        try {
            // Usa a mesma função de formatação que já existe
            const formatarNomeColecao = (nome) => {
                if (nome === 'BAÍA DE TODOS OS SANTOS (DIRETORIA)') {
                    return 'agendamentos_BAIADETODOSOSSANTOS(DIRETORIA)';
                }
                return 'agendamentos_' + nome
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^A-Z]/g, '')
                    .toUpperCase();
            };

            const colecaoNome = formatarNomeColecao(sala);
            const agendamentosRef = db.collection(colecaoNome);
            
            // Obtém todos os documentos da coleção
            const snapshot = await agendamentosRef.get();
            
            // Deleta cada documento
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            // Comita as deleções
            await batch.commit();           
        } catch (error) {
            console.error(`Erro ao limpar agendamentos para ${sala}:`, error);
        }
    }
}
// Função para trocar a sala
function trocarSala(sala) {
    document.getElementById('nomeSala').textContent = sala.toUpperCase();
    carregarAgendamentos();
    // Primeiro atualiza a seleção dos botões
    document.querySelectorAll('.room-buttons button').forEach(button => {
        button.classList.remove('selected');
    });
    // Adiciona a classe 'selected' ao botão da sala atual
    const botaoId = `botao${formatarIdSala(sala)}`;
    const botaoSelecionado = document.getElementById(botaoId);
    if (botaoSelecionado) {
        botaoSelecionado.classList.add('selected');
    }
    // Atualiza o nome da sala no mobile action sheet
    const nomeSalaMobileElements = document.querySelectorAll('#nomeSala');
    nomeSalaMobileElements.forEach(element => {
        element.textContent = sala.toUpperCase();
    });
    
// Atualiza o nome da sala
    document.getElementById('nomeSala').textContent = sala.toUpperCase();
    // Atualiza a URL sem recarregar a página  
    const url = new URL(window.location);
    url.searchParams.set('sala', sala);
    window.history.pushState({}, '', url);

    // Limpa seleções de horários, mas mantém a seleção do botão
    limparSelecao();    
    // Remove a classe 'selected' de todos os botões
    // Mapeamento entre o nome da sala e o ID do botão correspondente
    const salaParaBotaoID = {
        'PARIPE': 'botaoPARIPE',
        'ILHÉUS': 'botaoILHEUS',
        'BAÍA DE TODOS OS SANTOS (DIRETORIA)': 'botaoBAIADETODOSOSSANTOS'
    };

    // Obtém o ID do botão da sala atual usando o mapeamento
    const botaoID = salaParaBotaoID[sala];
    const selectedButton = document.getElementById(botaoID);

    // Aplica a classe 'selected' ao botão encontrado
    if (selectedButton) {
        selectedButton.classList.add('selected');
    } 
    // Regenera a semana mantendo a aba atual selecionada
    gerarSemana();
    atualizarDisponibilidadeSalas();
}
  const reservasRef = db.collection(`reservas_${salaSelecionada}`);

// Adicione esta função para marcar o botão da sala atual
function marcarBotaoSalaAtual() {
    const salaSelecionada = document.getElementById('nomeSala').textContent;
    
    // Remove a classe 'selected' de todos os botões
    const buttons = document.querySelectorAll('.room-buttons button');
    buttons.forEach(button => {
        button.classList.remove('selected');
    });
    // Mapeamento entre o nome da sala e o ID do botão correspondente
    const salaParaBotaoID = {
        'PARIPE': 'botaoPARIPE',
        'ILHÉUS': 'botaoILHEUS',
        'BAÍA DE TODOS OS SANTOS (DIRETORIA)': 'botaoBAIADETODOSOSSANTOS'
    };

    // Obtém o ID do botão da sala atual
    const botaoID = salaParaBotaoID[salaSelecionada];
    const selectedButton = document.getElementById(botaoID);

    // Aplica a classe 'selected' ao botão encontrado
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
}

// Verifica o sábado uma vez ao dia
setInterval(verificarESabado, 24 * 60 * 60 * 1000);
// Verificação imediata ao iniciar a aplicação
verificarESabado();
// Definindo primeiro `isMobile` para verificar o tipo de dispositivo
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
// Carrega localStorage ou aplica o padrão
document.addEventListener('DOMContentLoaded', () => {
    carregarAgendamentos();
    atualizarBadges();
    atualizarDisponibilidadeSalas();
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
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        checkbox.checked = true;
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.add('light');
        document.body.classList.remove('dark');
        checkbox.checked = false;
    }
}
document.getElementById('checkbox').addEventListener('change', toggleTheme);
document.addEventListener('DOMContentLoaded', checkTheme);

// Função para verificar se um horário já passou
// Função para verificar se um horário já passou
function isHoraPassada(horario) {
    const [hora, minuto] = horario.split(':').map(Number);
    const agora = new Date();

    if (agora.getHours() > hora) return true; // Hora já passou
    if (agora.getHours() === hora && agora.getMinutes() >= 5974) return true;
    return false; // Horário ainda disponível
}
// Função para atualizar horários passados em tempo real
function verificarHorariosPassados() {
    gerarSemana(); // Atualiza a interface sem usar filtro
    atualizarDisponibilidadeSalas();
}
// Verifica a cada minuto se algum horário passou, automatizando a atualização
setInterval(verificarHorariosPassados, 6000); // 60 segundos

// Função gerarSemana modificada
// Função gerarSemana modificada
function gerarSemana(diaInicial = 0) {
    limparSelecao();
    const tabsContainer = document.getElementById('diasSemanaTabs');
    const contentContainer = document.getElementById('diasSemanaContent');
    if (!tabsContainer || !contentContainer) {
        console.error('Elementos de tabs não encontrados');
        return;
    }
    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    const dataAtual = new Date();
    const diaAtual = dataAtual.getDay();
    const segundaFeira = new Date(dataAtual);
// Ajusta para a segunda-feira da semana atual
    if (diaAtual === 0) {
        segundaFeira.setDate(dataAtual.getDate() + 1);
    } else if (diaAtual === 6) {
        segundaFeira.setDate(dataAtual.getDate() + 2);
    } else {
        segundaFeira.setDate(dataAtual.getDate() - diaAtual + 1);
    }
   // Recupera o índice do último dia selecionado no localStorage, com padrão para segunda-feira (0)
   const lastSelectedDay = parseInt(localStorage.getItem('lastSelectedDay') || '0'); 

    for (let i = 0; i < 5; i++) {
        const dataDia = new Date(segundaFeira);
        dataDia.setDate(segundaFeira.getDate() + i);

        const dataFormatada = `${dataDia.getDate().toString().padStart(2, '0')}/${(dataDia.getMonth() + 1).toString().padStart(2, '0')}`;
        const diaId = diasSemana[i].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Cria a aba
        const tab = document.createElement('li');
        tab.className = 'nav-item';
        tab.role = 'presentation';
        tab.innerHTML = `
            <a class="nav-link ${i === lastSelectedDay ? 'active' : ''}" id="${diaId}-tab" data-bs-toggle="tab" href="#${diaId}" role="tab" aria-controls="${diaId}" aria-selected="${i === 0}">
                ${diasSemana[i]}<br>${dataFormatada}
            </a>
        `;
        tabsContainer.appendChild(tab);
        // Cria o conteúdo da aba
        const content = document.createElement('div');
        content.className = `tab-pane fade ${i === lastSelectedDay ? 'show active' : ''}`;
        content.id = diaId;
        content.role = 'tabpanel';
        content.setAttribute('aria-labelledby', `${diaId}-tab`);

        horarios.forEach(horario => {
            const horaDiv = document.createElement('div');
            let status = 'available';

            const ehPassado = dataDia < dataAtual || 
            (dataDia.toDateString() === dataAtual.toDateString() && isHoraPassada(horario));

            if (ehPassado) {
                status = 'past';
            }

            const idAgendamento = `${diasSemana[i]}_${dataFormatada.replace(/\//g, '_')}_${horario.replace(':', '-')}`;
            const agendamento = agendamentos[idAgendamento];

            if (agendamento) {
                if (status === 'past') {
                    status = 'past-occupied';
                } else {
                    status = 'occupied';
                }
                horaDiv.innerHTML = `
                    <span class="horario-hora">${horario}</span>
                    <span class="horario-nome-assunto">
                        <strong>Nome:</strong> ${agendamento.nome}<br>
                        <strong>Assunto:</strong> ${agendamento.assunto}
                    </span>`;
            } else {
                horaDiv.innerText = horario;
            }

            horaDiv.className = `horario ${status}`;
            horaDiv.dataset.horario = horario;
            horaDiv.dataset.diaSemana = diasSemana[i];
            horaDiv.dataset.dataDia = dataDia;

            if (status === 'available') {
                // Mantém os eventos de seleção múltipla
                initializeEvents(horaDiv);
            } else if (status === 'occupied') {
                horaDiv.onclick = () => cancelarAgendamento(idAgendamento);
            }

            content.appendChild(horaDiv);
        });

        contentContainer.appendChild(content);
    }
        // Adicione este evento para manter a aba selecionada
        tabsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav-link')) {
                // Salva o índice do dia selecionado
                const dayIndex = Array.from(tabsContainer.children).indexOf(e.target.parentElement);
                localStorage.setItem('lastSelectedDay', dayIndex);
                
                // Atualiza a aba ativa
                tabsContainer.querySelectorAll('.nav-link').forEach(tab => tab.classList.remove('active'));
                e.target.classList.add('active');
            }
            atualizarBadges();
            atualizarDisponibilidadeSalas();
    });
}

// Adiciona os botões de troca de sala
const salas = ['PARIPE', 'ILHÉUS', 'BAÍA DE TODOS OS SANTOS (DIRETORIA)'];
const botoesSalasDiv = document.getElementById('botoesSalas');

// Atualizar badges com a quantidade de horários disponíveis para todas as salas
async function atualizarBadges() {
    const salas = ['PARIPE', 'ILHÉUS', 'BAÍA DE TODOS OS SANTOS (DIRETORIA)'];
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0 (Domingo) a 6 (Sábado)
    const dataHoje = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;

    // Verifica se é final de semana (sábado ou domingo)
    if (diaSemana === 0 || diaSemana === 6) {
        // Define todos os badges como 0 nos finais de semana
        for (let sala of salas) {
            const formatarIdBadge = (nome) => {
                if (nome === 'BAÍA DE TODOS OS SANTOS (DIRETORIA)') {
                    return 'badgeBAIADETODOSOSSANTOS';
                }
                return 'badge' + nome
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^A-Z]/g, '')
                    .toUpperCase();
            };

            const badgeId = formatarIdBadge(sala);
            const badge = document.getElementById(badgeId);
            if (badge) {
                badge.textContent = '0';
            }
        }
        return; // Sai da função se for final de semana
    }

    // Continua com a lógica normal para dias úteis
    for (let sala of salas) {
        try {
            // Função para formatar o nome da sala para o nome da coleção
            const formatarNomeColecao = (nome) => {
                if (nome === 'BAÍA DE TODOS OS SANTOS (DIRETORIA)') {
                    return 'agendamentos_BAIADETODOSOSSANTOS(DIRETORIA)';
                }
                return 'agendamentos_' + nome
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^A-Z]/g, '')
                    .toUpperCase();
            };

            // Função para formatar o nome da sala para o ID do badge
            const formatarIdBadge = (nome) => {
                if (nome === 'BAÍA DE TODOS OS SANTOS (DIRETORIA)') {
                    return 'badgeBAIADETODOSOSSANTOS';
                }
                return 'badge' + nome
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^A-Z]/g, '')
                    .toUpperCase();
            };

            const colecaoNome = formatarNomeColecao(sala);
            const badgeId = formatarIdBadge(sala);
            
            const agendamentosRef = db.collection(colecaoNome);
            const querySnapshot = await agendamentosRef
                .where('data', '==', dataHoje)
                .get();

            let agendamentosHoje = [];
            querySnapshot.forEach(doc => {
                const dados = doc.data();
                agendamentosHoje.push(dados.horario);
            });

            const totalHorarios = horarios.length;
            let countDisponiveis = 0;
            horarios.forEach(horario => {
                if (!isHoraPassada(horario) && !agendamentosHoje.includes(horario)) {
                    countDisponiveis++;
                }
            });

            const badge = document.getElementById(badgeId);
            if (badge) {
                badge.textContent = countDisponiveis;
            } else {
                console.warn(`Badge não encontrado para ID: ${badgeId}`);
            }

        } catch (error) {
        }
    }
}
atualizarBadges(); // Chama a função para mostrar os badges na inicialização
atualizarDisponibilidadeSalas();
// Adiciona QR Codes para cada sala
const qrCodesContainer = document.getElementById('qrCodes');

if (qrCodesContainer && salas) { // Verifica se o container e o array de salas existem
    salas.forEach(sala => {
        const qrCodeDiv = document.createElement('div');
        qrCodeDiv.className = 'qr-code-item'; // Adiciona uma classe para estilização
        qrCodeDiv.innerHTML = `
            <a href="?sala=${encodeURIComponent(sala)}">
                <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(window.location.href)}&sala=${encodeURIComponent(sala)}&size=100x100" alt="QR Code para ${sala}">
            </a>
            <p>${sala}</p> <!-- Nome da sala abaixo do QR code -->
        `;
        qrCodesContainer.appendChild(qrCodeDiv);
    });
} else {
    console.warn("Elemento 'qrCodes' ou array 'salas' não encontrado no DOM.");
}
// Função para abrir o modal de agendamento unico ou multiplo e salvar no Firestore
async function abrirModal(horarioOuArray) {
    const salaSelecionada = document.getElementById('nomeSala').textContent;
    const agendamentosRef = db.collection(`agendamentos_${formatarIdSala(salaSelecionada)}`);
    // Define o CSS para o título da modal
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
            .swal2-confirm:hover {
            background-color: #37d1a3;
            }
            .swal2-cancel {
                background-color: red;
                color: white;
            padding: 10px 20px;
            border-radius: 5px;
            transition: background-color 0.2s ease;
            }
            .swal2-cancel:hover {
            background-color: #d9534f;
            }
            .swal2-popup {
                border-radius: 10px;
            }
                .instrucoes-justificadas {
                text-align: justify;
            }
        </style>
    `;
    try {
        // Ordena os horários antes de formatá-los
        const horariosOrdenados = horarioOuArray.sort((a, b) => {
            // Primeiro, compara as datas
            const dataA = new Date(a.dataDia);
            const dataB = new Date(b.dataDia);
            
            if (dataA.getTime() !== dataB.getTime()) {
                return dataA - dataB;
            }
            
            // Se as datas forem iguais, compara os horários
            const [horaA, minutoA] = a.horario.split(':').map(Number);
            const [horaB, minutoB] = b.horario.split(':').map(Number);
            
            // Compara primeiro as horas
            if (horaA !== horaB) {
                return horaA - horaB;
            }
            
            // Se as horas forem iguais, compara os minutos
            return minutoA - minutoB;
        });

        // Formata os horários ordenados para exibição
        const horariosFormatados = horariosOrdenados.map(h => {
            if (h && h.diaSemana && h.dataDia && h.horario) {
                const dataFormatada = h.dataDia instanceof Date ? 
                    `${h.dataDia.getDate().toString().padStart(2, '0')}/${(h.dataDia.getMonth() + 1).toString().padStart(2, '0')}/${h.dataDia.getFullYear()}` : 
                    'Data inválida';
                return `${h.diaSemana} (${dataFormatada}) - ${h.horario}`;
            }
            return 'Horário inválido';
        }).join('<br>');

        // Exibe o input para o nome do usuário
        const { value: nome } = await Swal.fire({
            title: `SALA ${salaSelecionada}<br>Agendamento de horário(s)`,
            html: `Horários selecionados:<br>${horariosFormatados}<br><br>`,
            input: 'text',
            inputLabel: 'Bem vindo, por favor digite seu nome:',
            inputValue: '',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            backdrop: 'static',
            allowOutsideClick: false,
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return 'Por favor, digite um nome válido.';
                }
                if (value.length > 20) {
                    return 'O nome deve ter no máximo 20 caracteres.';
                }
            },
            // Adiciona o estilo customizado na modal
            willOpen: () => {
                Swal.getHtmlContainer().insertAdjacentHTML('afterbegin', customStyles);
            } 
        });

        if (!nome) return;

          // Função para capitalizar a primeira letra de cada palavra
        function capitalizeEachWord(nome) {
        return nome
        .toLowerCase() // Primeiro, converte tudo para minúsculas
        .split(' ') // Divide o nome em palavras
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitaliza a primeira letra de cada palavra
        .join(' '); // Junta as palavras de volta em uma string
}

        // Exibe o input para o assunto
        const { value: assunto } = await Swal.fire({
            title: `SALA ${salaSelecionada}<br>Agendamento de horário(s)`,
            input: 'text',
            inputLabel: `Olá, ${capitalizeEachWord(nome)} digite o assunto:`, // Exibe o nome com a primeira letra maiúscula
            inputValue: '',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            backdrop: 'static',
            allowOutsideClick: false,
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return 'Por favor, digite um assunto válido.';
                }
            },
            // Adiciona o estilo customizado na modal
            willOpen: () => {
                Swal.getHtmlContainer().insertAdjacentHTML('afterbegin', customStyles);
            } 
        });

        if (!assunto) return;
    // Converte valores para maiúsculas
    const nomeUpper = nome.toUpperCase();
    const assuntoUpper = assunto.toUpperCase();

        // Salva os agendamentos no Firestore
        for (const horario of horarioOuArray) {
            if (horario && horario.dataDia instanceof Date) {
                const dataFormatada = `${horario.dataDia.getDate().toString().padStart(2, '0')}/${(horario.dataDia.getMonth() + 1).toString().padStart(2, '0')}`;
                const idAgendamento = `${horario.diaSemana}_${dataFormatada.replace(/\//g, '_')}_${horario.horario.replace(':', '-')}`;

                await agendamentosRef.doc(idAgendamento).set({
                    nome: nomeUpper,
                    assunto: assuntoUpper,
                    horario: horario.horario,
                    diaSemana: horario.diaSemana,
                    data: dataFormatada,
                    chave: idAgendamento
                });
            }
        }
        // Mensagem de sucesso
        await Swal.fire({
            icon: 'success',
            title: 'Agendamento(s) Realizado(s)!',
            html: `Obrigado por utilizar o InterMeeting.<br><br>
            <b>Por favor, siga as seguintes instruções:</b><br><br>
            <div class="instrucoes-justificadas"><b>1.</b> Se não puder comparecer, cancele seu agendamento para liberar a visualização do horário da sala para outros usuários;<br>
            <b>2.</b> Durante o uso, lembre-se de virar a placa para <b>"OCUPADO"</b>. Ao sair, retorne-a para <b>"LIVRE"</b>;<br>
            <b>3.</b> Ao final do uso, reorganize a sala, desligue o ar-condicionado e as luzes, ajudando a economizar energia e a manter o local pronto para o próximo uso;<br>
            <b>4.</b> Por favor, cancele agendamentos apenas se a sala estiver desocupada ou se o agendamento for realmente seu.<br><br></div>
            <b>Agradecemos sua colaboração em criar um ambiente mais sustentável e organizado!</b>
            </br>`,
            confirmButtonText: 'OK',
            backdrop: 'static',
            allowOutsideClick: false,
            customClass: {
            confirmButton: 'swal2-confirm'
            },
            willOpen: () => {
                Swal.getHtmlContainer().insertAdjacentHTML('afterbegin', customStyles);
            }
        });

        // Atualiza a interface
        selectedHorarios = [];
        atualizarBadges();
        gerarSemana();
        carregarAgendamentos();
        atualizarDisponibilidadeSalas();
        if (!nome || !assunto) {
            limparSelecao();
            return;
        }
    } catch (error) {
            Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Ocorreu um erro ao salvar o agendamento. Tente novamente mais tarde.'
        });
    }
}

// Adicione esta função no início do seu arquivo ou antes da função cancelarAgendamento
function capitalizeEachWord(str) {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}


//função que calcula dispobibilidade de hora para a função trocar ou cancelar agendamento//
async function obterHorariosDisponiveis(sala, data, horarioAtual = null) {
    try {
        const agendamentosRef = db.collection(`agendamentos_${formatarIdSala(sala)}`);
        const snapshot = await agendamentosRef.where('data', '==', data).get();
        
        // Cria um conjunto com todos os horários possíveis
        const todosHorarios = new Set(horarios);

        // Remove os horários já agendados, exceto o horário atual (se for o mesmo)
        snapshot.forEach(doc => {
            const agendamento = doc.data();
            // Remove apenas os horários que não são o horário atual
            if (agendamento.horario !== horarioAtual) {
                todosHorarios.delete(agendamento.horario);
            }
        });

        // Remove horários passados
        const horariosDisponiveis = Array.from(todosHorarios).filter(horario => !isHoraPassada(horario));

        return {
            disponiveis: horariosDisponiveis,
            ocupados: Array.from(snapshot.docs.map(doc => doc.data().horario))
        };
    } catch (error) {
        console.error('Erro ao obter horários disponíveis:', error);
        throw error;
    }
}
//Função que passa o horario antigo pro novo //
async function selecionarNovoHorario(salaOrigem, salaDestino, horarioOriginal, novoHorario, agendamento) {
    try {
        const refOrigem = db.collection(`agendamentos_${formatarIdSala(salaOrigem)}`);
        const refDestino = db.collection(`agendamentos_${formatarIdSala(salaDestino)}`);

        // Cria novo ID para o agendamento
        const novoId = `${agendamento.diaSemana}_${agendamento.data.replace(/\//g, '_')}_${novoHorario.replace(':', '-')}`;
        const idOriginal = `${agendamento.diaSemana}_${agendamento.data.replace(/\//g, '_')}_${horarioOriginal.replace(':', '-')}`;

        // Cria novo documento com horário atualizado
        const novoAgendamento = {
            ...agendamento,
            horario: novoHorario,
            chave: novoId
        };

        // Executa as operações em batch
        const batch = db.batch();
        batch.delete(refOrigem.doc(idOriginal));
        batch.set(refDestino.doc(novoId), novoAgendamento);
        await batch.commit();

        return true;
    } catch (error) {
        console.error('Erro ao trocar horário:', error);
        throw error;
    }
}

//função para seleção de nova sala//
async function selecionarNovaSala(agendamento, salasDisponiveis) {
    try {
        // Primeiro, mostra o modal de seleção da sala
        const { value: salaDestino } = await Swal.fire({
            title: 'Selecione a nova sala',
            html: `
                <p>Agendamento atual:</p>
                <p><b>Data:</b> ${agendamento.diaSemana} (${agendamento.data})</p>
                <p><b>Horário:</b> ${agendamento.horario}</p>
                <p><b>Nome:</b> ${capitalizeEachWord(agendamento.nome)}</p>
            `,
            input: 'select',
            inputOptions: salasDisponiveis.reduce((opts, sala) => {
                opts[sala] = sala;
                return opts;
            }, {}),
            inputPlaceholder: 'Escolha a sala de destino',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Confirmar',
            inputValidator: (value) => {
                if (!value) {
                    return 'Você precisa selecionar uma sala!';
                }
            }
        });

        if (!salaDestino) return null;

        // Verifica se o horário está disponível na sala de destino
        const { disponiveis } = await obterHorariosDisponiveis(salaDestino, agendamento.data);
        
        if (!disponiveis.includes(agendamento.horario)) {
            await Swal.fire({
                icon: 'error',
                title: 'Horário Indisponível',
                text: 'Este horário já está ocupado na sala selecionada.'
            });
            return null;
        }

        // Confirmação final
        const confirmacao = await Swal.fire({
            title: 'Confirmar troca de sala',
            html: `
                <p>Você está prestes a transferir o agendamento para:</p>
                <p><b>Nova Sala:</b> ${salaDestino}</p>
                <p><b>Data:</b> ${agendamento.diaSemana} (${agendamento.data})</p>
                <p><b>Horário:</b> ${agendamento.horario}</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, trocar sala',
            cancelButtonText: 'Cancelar'
        });

        if (confirmacao.isConfirmed) {
            return salaDestino;
        }

        return null;
    } catch (error) {
        console.error('Erro ao selecionar nova sala:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Ocorreu um erro ao selecionar a nova sala.'
        });
        return null;
    }
}

//Função para Cancelar ou trocar agendamentos//
async function cancelarAgendamento(idAgendamento) {
    const salaSelecionada = document.getElementById('nomeSala').textContent;
    const agendamentosRef = db.collection(`agendamentos_${formatarIdSala(salaSelecionada)}`);

    try {
        const formattedId = idAgendamento.replace(/\//g, '_').replace(/:/g, '-');
        const agendamento = agendamentos[idAgendamento];

        if (!agendamento) {
            throw new Error('Agendamento não encontrado');
        }

        const todasSalas = ['PARIPE', 'ILHÉUS', 'BAÍA DE TODOS OS SANTOS (DIRETORIA)'].filter(sala => sala !== salaSelecionada);

        const result = await Swal.fire({
            title: `SALA ${salaSelecionada}<br><br>CANCELAMENTO OU TROCA DE AGENDAMENTO`,
            html: `
                <p>Você está no agendamento de ${capitalizeEachWord(agendamento.nome)}</p><p><b>Data: ${agendamento.diaSemana} (${agendamento.data}) - ${agendamento.horario}</b></p><p>
                <p><b>O que deseja fazer?</b></p>
                <button type="button" class="troca-sala-btn" id="btnTrocaSala">Trocar de Sala</button>
                <button type="button" class="troca-sala-btn" id="btnTrocaHorario">Trocar de Horário</button>
                <button type="button" class="troca-sala-btn" id="btnCancelar">Apenas Cancelar</button>
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Fechar',
            allowOutsideClick: false,
                didOpen: () => {
                    const styleTag = document.createElement('style');
                    styleTag.innerHTML = `
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
                        .info-agendamento {
                            font-size: 14px;
                            font-weight: normal;
                        }
                        .alerta-atencao {
                            color: red;
                            font-weight: bold;
                        }
                        .texto-aviso {
                            font-size: 12px;
                            font-style: italic;
                            color: #333;
                        }
                        .troca-sala-btn {
                            background-color: #4CAF50;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            margin: 10px;
                            cursor: pointer;
                        }
                        .troca-sala-btn:hover {
                            background-color: #45a049;
                        }
                        .sala-destino-select {
                            margin: 10px;
                            padding: 5px;
                            border-radius: 5px;
                        }
                        .horarios-adicionais {
                            margin-top: 10px;
                            padding: 10px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                        }
                        .horarios-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 10px;
                            margin-top: 15px;
                        }
                        .horario-btn {
                            padding: 5px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            cursor: pointer;
                        }
                        .horario-btn.ocupado {
                            background-color: #ffcccb;
                            cursor: not-allowed;
                        }
                        .horario-btn.ocupado:hover {
                            background-color: #ff9999;
                        }
                        .horario-btn.disponivel {
                            background-color: #90ee90;
                        }
                        .horario-btn.selected {
                            border: 2px solid #007bff;
                        }
                        .horario-info {
                            font-size: 12px;
                            margin-top: 5px;
                        }
                        #confirmarTrocaBtn {
                            background-color: green;
                            color: white;
                            border: 2px solid green;
                            border-radius: 5px;
                        }
                    `;
                    document.querySelector('.swal2-popup').appendChild(styleTag);

                const btnTrocaSala = document.getElementById('btnTrocaSala');
                if (btnTrocaSala) {
                    btnTrocaSala.addEventListener('click', async () => {
                        const novaSalaDestino = await selecionarNovaSalaAlternativa(agendamento, todasSalas);
                
                        if (novaSalaDestino) {
                            try {
                                // Referências para as salas origem e destino
                                const refOrigem = db.collection(`agendamentos_${formatarIdSala(salaSelecionada)}`);
                                const refDestino = db.collection(`agendamentos_${formatarIdSala(novaSalaDestino)}`);
                                
                                // Identificadores para o agendamento na origem e destino
                                const idOriginal = `${agendamento.diaSemana}_${agendamento.data.replace(/\//g, '_')}_${agendamento.horario.replace(':', '-')}`;
                                const novoId = `${agendamento.diaSemana}_${agendamento.data.replace(/\//g, '_')}_${agendamento.horario.replace(':', '-')}`;
                                
                                // Verifica se o horário já está ocupado na nova sala
                                const destinoDoc = await refDestino.doc(novoId).get();
                                
                                if (destinoDoc.exists) {
                                    const agendamentoOcupado = destinoDoc.data();
                
                                    // Exibe opções para cancelar, manter ou trocar com a pessoa na sala destino
                                    const confirmacao = await Swal.fire({
                                        title: 'Horário Ocupado!',
                                        html: `
                                            <p>O horário ${agendamento.horario} na sala ${novaSalaDestino} já está ocupado por:</p>
                                            <p><b>Nome:</b> ${capitalizeEachWord(agendamentoOcupado.nome)}</p>
                                            <p><b>Assunto:</b> ${agendamentoOcupado.assunto}</p>
                                            <p>Escolha uma opção:</p>
                                        `,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        cancelButtonText: 'Não, manter agendamento atual',
                                        showDenyButton: true,
                                        showConfirmButton: true,
                                        confirmButtonText: 'Sim, cancelar e transferir',
                                        denyButtonText: 'Trocar de sala com esta pessoa'
                                    });
                
                                    if (confirmacao.isDenied) {
                                        // Opção de troca de sala com a pessoa
                                        const batch = db.batch();
                
                                        // Troca o agendamento atual com o agendamento ocupado
                                        batch.set(refOrigem.doc(idOriginal), agendamentoOcupado); // Move agendamento da sala destino para origem
                                        batch.set(refDestino.doc(novoId), agendamento); // Move o agendamento atual para a sala destino
                                        await batch.commit();
                
                                        Swal.fire('Troca de salas realizada com sucesso!', '', 'success');
                                        
                                    } else if (confirmacao.isConfirmed) {
                                        // Opção de cancelar o agendamento na nova sala e mover o atual
                                        await refDestino.doc(novoId).delete(); // Cancela o agendamento existente
                                        const novoAgendamento = { ...agendamento, chave: novoId };
                                        
                                        // Executa a transferência do agendamento original para a nova sala
                                        const batch = db.batch();
                                        batch.delete(refOrigem.doc(idOriginal));
                                        batch.set(refDestino.doc(novoId), novoAgendamento);
                                        await batch.commit();
                
                                        Swal.fire('Troca de sala realizada com sucesso!', '', 'success');
                                    } else {
                                        // Se o usuário cancela a ação, encerra a função
                                        return;
                                    }
                                } else {
                                    // Se a nova sala estiver disponível, transfere o agendamento normalmente
                                    const novoAgendamento = { ...agendamento, chave: novoId };
                                    
                                    const batch = db.batch();
                                    batch.delete(refOrigem.doc(idOriginal));
                                    batch.set(refDestino.doc(novoId), novoAgendamento);
                                    await batch.commit();
                
                                    Swal.fire('Troca de sala realizada com sucesso!', '', 'success');
                                }
                
                                // Atualiza a interface para refletir a troca
                                carregarAgendamentos();
                                atualizarBadges();
                                gerarSemana();
                                atualizarDisponibilidadeSalas();
                
                            } catch (error) {
                                console.error('Erro ao transferir o agendamento para a nova sala:', error);
                                Swal.fire('Erro ao transferir o agendamento para a nova sala.', '', 'error');
                            }
                        }
                    });
                }                                       

                const btnTrocaHorario = document.getElementById('btnTrocaHorario');
                if (btnTrocaHorario) {
                    btnTrocaHorario.addEventListener('click', async () => {
                        const novoHorario = await selecionarNovoHorarioSalaAtual(salaSelecionada, agendamento);
                        if (novoHorario) {
                            await selecionarNovoHorario(salaSelecionada, salaSelecionada, agendamento.horario, novoHorario, agendamento);
                            Swal.fire('Troca de horário realizada com sucesso!', '', 'success');
                        }
                    });
                }

                const btnCancelar = document.getElementById('btnCancelar');
                if (btnCancelar) {
                    btnCancelar.addEventListener('click', async () => {
                        const confirmacao = await Swal.fire({
                            title: 'Confirmação de Cancelamento',
                            html: `
                                <p>Você está prestes a cancelar o agendamento de ${capitalizeEachWord(agendamento.nome)}, em SALA ${salaSelecionada}, em ${agendamento.data} às ${agendamento.horario}.</p>
                                <p><b>Deseja confirmar o cancelamento?</b></p>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'Sim, cancelar',
                            cancelButtonText: 'Sair'
                        });

                        if (confirmacao.isConfirmed) {
                            await agendamentosRef.doc(formattedId).delete();
                            Swal.fire({
                                icon: 'success',
                                title: 'Agendamento cancelado com sucesso!',
                                text: 'O horário está novamente disponível.',
                                confirmButtonText: 'OK'
                            });
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error('Erro ao processar agendamento:', error);
        Swal.fire('Erro ao processar o agendamento', '', 'error');
    }
}
//função de seleção das salas disponíveis/Demonstrando quem está la se ocupado essa função casa com a selecionarNovaSala
async function selecionarNovaSalaAlternativa(agendamento, salasDisponiveis) {
    const { value: salaDestino } = await Swal.fire({
        title: 'Selecione a sala de destino',
        input: 'select',
        inputOptions: salasDisponiveis.reduce((opts, sala) => {
            opts[sala] = sala;
            return opts;
        }, {}),
        inputPlaceholder: 'Selecione a sala',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
    });

    if (!salaDestino) return null;

    const { disponiveis } = await obterHorariosDisponiveis(salaDestino, agendamento.data);

    if (disponiveis.length === 0) {
        Swal.fire('Nenhum horário disponível', '', 'info');
        return null;
    }

    return salaDestino;
}
//Função para selecionar novos horários na sala atual//
async function selecionarNovoHorarioSalaAtual(salaSelecionada, agendamento) {
    const { disponiveis } = await obterHorariosDisponiveis(salaSelecionada, agendamento.data);
    if (disponiveis.length === 0) {
        Swal.fire('Nenhum horário disponível para troca.', '', 'info');
        return null;
    }

    const { value: novoHorario } = await Swal.fire({
        title: 'Selecione um novo horário disponível:',
        input: 'select',
        inputOptions: disponiveis.reduce((opts, horario) => {
            opts[horario] = horario;
            return opts;
        }, {}),
        inputPlaceholder: 'Horários disponíveis',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
    });

    return novoHorario || null;
}

atualizarBadges();
carregarAgendamentos();
gerarSemana();
atualizarDisponibilidadeSalas();
// Atualização inicial
document.addEventListener('DOMContentLoaded', () => {
    checkTheme();
    marcarBotaoSalaAtual();  
    gerarSemana();
    carregarAgendamentos();
    atualizarBadges();
    atualizarDisponibilidadeSalas();
});

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        var tabElms = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabElms.forEach(function(tabElm) {
            new bootstrap.Tab(tabElm);
        });
    }, 100);
});

function reinicializarTabs() {
    setTimeout(() => {
        const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabs.forEach(tab => {
            try {
                new bootstrap.Tab(tab);
            } catch (error) {
                console.warn('Tab já inicializada:', tab);
            }
        });
    }, 100);
}

window.addEventListener('beforeunload', function() {
    limparSelecao();
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        limparSelecao();
    }
});
