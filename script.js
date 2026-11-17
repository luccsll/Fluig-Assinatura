/* Campo de assinatura no formulário do Fluig, com canvas e jQuery · lucaslima.dev */
var Assinatura = (function ($) {

  var COR = '#000000';
  var ESPESSURA = 2.5;
  var MARGEM = 12;         // espaço em volta do traço na imagem recortada

  function iniciar($bloco) {
    var $area = $bloco.find('.assinaturaArea');
    var canvas = $bloco.find('.assinaturaCanvas')[0];
    var ctx = canvas.getContext('2d');
    var $campo = $bloco.find('textarea');

    var tracos = [];       // cada traço é uma lista de pontos {x, y}
    var atual = null;      // o traço que está sendo desenhado

    // ---- Só leitura: mostra a imagem gravada e para por aqui ----
    if ($campo.prop('readonly') || $campo.prop('disabled')) {
      var valor = $campo.val();
      $bloco.addClass('somenteLeitura');
      if (valor) {
        $bloco.addClass('temAssinatura');
        $bloco.find('.assinaturaImagem').attr('src', valor);
      } else {
        $bloco.find('.assinaturaDica').text('Sem assinatura');
      }
      return;
    }

    // ---- Canvas nítido em tela retina ----
    function ajustarTamanho() {
      var dpr = window.devicePixelRatio || 1;
      var largura = $area.width();
      var altura = $area.height();
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // desenha em px de CSS
      redesenhar();
    }

    // ---- Traço suave: curva passando pelo meio de cada par de pontos ----
    function desenharTraco(pontos) {
      ctx.strokeStyle = COR;
      ctx.lineWidth = ESPESSURA;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      if (pontos.length === 1) {               // um toque vira um ponto
        ctx.arc(pontos[0].x, pontos[0].y, ESPESSURA / 2, 0, Math.PI * 2);
        ctx.fillStyle = COR;
        ctx.fill();
        return;
      }

      ctx.moveTo(pontos[0].x, pontos[0].y);
      for (var i = 1; i < pontos.length - 1; i++) {
        var meioX = (pontos[i].x + pontos[i + 1].x) / 2;
        var meioY = (pontos[i].y + pontos[i + 1].y) / 2;
        ctx.quadraticCurveTo(pontos[i].x, pontos[i].y, meioX, meioY);
      }
      var ultimo = pontos[pontos.length - 1];
      ctx.lineTo(ultimo.x, ultimo.y);
      ctx.stroke();
    }

    function redesenhar() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      $.each(tracos, function (i, pontos) { desenharTraco(pontos); });
      if (atual) desenharTraco(atual);
      $bloco.toggleClass('temAssinatura', tracos.length > 0 || !!atual);
    }

    function ponto(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    // ---- Mouse, dedo e caneta: Pointer Events tratam os três ----
    $(canvas).on('pointerdown', function (e) {
      e.preventDefault();
      canvas.setPointerCapture(e.originalEvent.pointerId);
      atual = [ponto(e.originalEvent)];
      $bloco.removeClass('comErro');
      redesenhar();
    });

    $(canvas).on('pointermove', function (e) {
      if (!atual) return;
      atual.push(ponto(e.originalEvent));
      redesenhar();
    });

    $(canvas).on('pointerup pointercancel', function () {
      if (!atual) return;
      tracos.push(atual);
      atual = null;
      redesenhar();
      gravar();
    });

    // ---- Desfazer e limpar ----
    $bloco.find('.assinaturaDesfazer').on('click', function () {
      tracos.pop();
      redesenhar();
      gravar();
    });

    $bloco.find('.assinaturaLimpar').on('click', function () {
      tracos = [];
      redesenhar();
      gravar();
    });

    // ---- Grava no campo: PNG recortado no tamanho do traço ----
    function gravar() {
      $campo.val(tracos.length ? gerarImagem() : '');
    }

    function gerarImagem() {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      $.each(tracos, function (i, pontos) {
        $.each(pontos, function (j, p) {
          minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
        });
      });

      var dpr = window.devicePixelRatio || 1;
      var x = Math.max(0, minX - MARGEM) * dpr;
      var y = Math.max(0, minY - MARGEM) * dpr;
      var largura = Math.min(canvas.width - x, (maxX - minX + MARGEM * 2) * dpr);
      var altura = Math.min(canvas.height - y, (maxY - minY + MARGEM * 2) * dpr);

      var recorte = document.createElement('canvas');
      recorte.width = largura;
      recorte.height = altura;
      recorte.getContext('2d').drawImage(canvas, x, y, largura, altura, 0, 0, largura, altura);

      return recorte.toDataURL('image/png');   // "data:image/png;base64,..."
    }

    // ---- Se o campo já tem valor (rascunho salvo), mostra a imagem ----
    if ($campo.val()) {
      var img = new Image();
      img.onload = function () {
        var r = $area[0].getBoundingClientRect();
        var dpr = window.devicePixelRatio || 1;
        var w = img.width / dpr, h = img.height / dpr;
        ctx.drawImage(img, (r.width - w) / 2, (r.height - h) / 2, w, h);
        $bloco.addClass('temAssinatura');
      };
      img.src = $campo.val();
    }

    ajustarTamanho();
    $(window).on('resize', ajustarTamanho);
  }

  // ---- Converte o base64 do campo em arquivo, para anexar ou baixar ----
  function paraArquivo(dataUrl, nome) {
    var partes = dataUrl.split(',');
    var tipo = partes[0].match(/:(.*?);/)[1];
    var binario = atob(partes[1]);
    var bytes = new Uint8Array(binario.length);
    for (var i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return new File([bytes], nome || 'assinatura.png', { type: tipo });
  }

  // ---- Confere as assinaturas obrigatórias antes de enviar ----
  function validar() {
    var faltando = $('.assinatura[data-obrigatoria="true"]').filter(function () {
      return !$(this).hasClass('somenteLeitura') && !$(this).find('textarea').val();
    });
    faltando.addClass('comErro');
    return faltando.length === 0;
  }

  return { iniciar: iniciar, paraArquivo: paraArquivo, validar: validar };
})(jQuery);

$(function () {
  $('.assinatura').each(function () { Assinatura.iniciar($(this)); });
});

/* Antes de enviar a solicitação: bloqueia se faltar assinatura obrigatória */
var beforeSendValidate = function (numState, nextState) {
  if (!Assinatura.validar()) {
    throw 'A assinatura do solicitante é obrigatória.';
  }
  return true;
};
