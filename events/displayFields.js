function displayFields(form, customHTML) {
    var INICIO = 4;   // número da atividade inicial do seu processo
    var atividade = parseInt(getValue("WKNumState"));

    // Mantém o campo desabilitado como campo, para o componente ler a imagem
    form.setShowDisabledFields(true);

    // Fora da atividade em que a pessoa assina, a assinatura fica só para leitura
    if (atividade != INICIO && atividade != 0) {
        form.setEnabled("assinaturaSolicitante", false);
    }
}
