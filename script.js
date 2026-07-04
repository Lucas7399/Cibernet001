// ==========================================================
// CIBERNET — script principal do site
// ==========================================================

document.getElementById('anoAtual').textContent = new Date().getFullYear();

// ---- menu mobile ----
const navToggle = document.getElementById('navToggle');
const mainNav = document.querySelector('.main-nav');
navToggle.addEventListener('click', () => {
  const aberto = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
});
document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ---- botão "Quero este plano" nos cards ----
function selecionarPlano(valor) {
  const select = document.getElementById('planoAcesso');
  if (select) select.value = valor;
}
window.selecionarPlano = selecionarPlano;

// ---- autocomplete de endereço via ViaCEP ----
const cepInput = document.getElementById('cep');
const cepStatus = document.getElementById('cepStatus');

cepInput.addEventListener('blur', async () => {
  const cep = cepInput.value.replace(/\D/g, '');
  if (cep.length !== 8) return;

  cepStatus.textContent = 'Buscando endereço...';
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resp.json();
    if (dados.erro) {
      cepStatus.textContent = 'CEP não encontrado. Preencha manualmente.';
      return;
    }
    document.getElementById('endereco').value = dados.logradouro || '';
    document.getElementById('bairro').value = dados.bairro || '';
    document.getElementById('cidade').value = dados.localidade || '';
    const estadoSelect = document.getElementById('estado');
    const nomesEstados = {
      AC:'Acre', AL:'Alagoas', AP:'Amapá', AM:'Amazonas', BA:'Bahia', CE:'Ceará',
      DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás', MA:'Maranhão',
      MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais', PA:'Pará',
      PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí', RJ:'Rio de Janeiro',
      RN:'Rio Grande do Norte', RS:'Rio Grande do Sul', RO:'Rondônia', RR:'Roraima',
      SC:'Santa Catarina', SP:'São Paulo', SE:'Sergipe', TO:'Tocantins'
    };
    const nomeEstado = nomesEstados[dados.uf];
    if (nomeEstado) estadoSelect.value = nomeEstado;
    cepStatus.textContent = 'Endereço preenchido automaticamente.';
  } catch (e) {
    cepStatus.textContent = 'Não foi possível buscar o CEP agora. Preencha manualmente.';
  }
});

// ---- descobre o IP público de quem está preenchendo o cadastro ----
async function obterIP() {
  try {
    const resp = await fetch('https://api.ipify.org?format=json');
    const dados = await resp.json();
    return dados.ip || 'não identificado';
  } catch (e) {
    return 'não identificado';
  }
}

// ---- envio do formulário de cadastro ----
const form = document.getElementById('formCadastro');
const formMsg = document.getElementById('formMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  formMsg.classList.remove('erro');
  formMsg.textContent = 'Enviando cadastro...';

  const dados = Object.fromEntries(new FormData(form).entries());
  const ip = await obterIP();

  const cliente = {
    id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
    nome: dados.nome,
    email: dados.email,
    login: dados.login,
    senha: dados.senha,
    cpfCnpj: dados.cpfCnpj,
    rg: dados.rg,
    dataNasc: dados.dataNasc,
    telefone: dados.telefone || '',
    celular: dados.celular,
    endereco: `${dados.endereco}, ${dados.numero}${dados.complemento ? ' - ' + dados.complemento : ''}`,
    bairro: dados.bairro,
    cidade: dados.cidade,
    estado: dados.estado,
    cep: dados.cep,
    plano: dados.planoAcesso + ' Mbps',
    vencimento: 'Todo dia ' + dados.vencimento,
    codigo: dados.codigo || '',
    ip: ip,
    origem: 'site',
    status: 'ativo',
    criadoEm: new Date().toISOString()
  };

  const listaAtual = JSON.parse(localStorage.getItem('cibernet_clientes') || '[]');
  listaAtual.push(cliente);
  localStorage.setItem('cibernet_clientes', JSON.stringify(listaAtual));

  formMsg.textContent = 'Cadastro enviado com sucesso! Em breve entraremos em contato para confirmar a instalação.';
  form.reset();
  btn.disabled = false;
});