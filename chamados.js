// ==========================================================
// CIBERNET — página pública de chamados
// ==========================================================

document.getElementById('anoAtual').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const mainNav = document.querySelector('.main-nav');
navToggle.addEventListener('click', () => {
  const aberto = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
});

function gerarProtocolo() {
  const numero = Math.floor(100000 + Math.random() * 900000);
  return 'CN-' + numero;
}

const form = document.getElementById('formChamado');
const msg = document.getElementById('chMsg');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const dados = Object.fromEntries(new FormData(form).entries());
  const chamado = {
    id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
    protocolo: gerarProtocolo(),
    nome: dados.nome,
    cpf: dados.cpf,
    telefone: dados.telefone,
    endereco: dados.endereco,
    motivo: dados.motivo,
    status: 'Aberto',
    criadoEm: new Date().toISOString()
  };

  const lista = JSON.parse(localStorage.getItem('cibernet_chamados') || '[]');
  lista.push(chamado);
  localStorage.setItem('cibernet_chamados', JSON.stringify(lista));

  msg.textContent = `Chamado aberto com sucesso! Seu protocolo é ${chamado.protocolo}. Guarde este número para acompanhar o atendimento.`;
  form.reset();
});