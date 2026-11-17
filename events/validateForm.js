function validateForm(form) {
    var INICIO = 4;   // número da atividade inicial do seu processo
    var atividade = parseInt(getValue("WKNumState"));

    if ((atividade == INICIO || atividade == 0) && form.getValue("assinaturaSolicitante") == "") {
        throw "A assinatura do solicitante é obrigatória.";
    }
}
