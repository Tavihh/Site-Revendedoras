function mascaraTelefone(input) {
    let value = input.value.replace(/\D/g, ''); // Remove tudo o que não for número
    if (value.length <= 10) {
        input.value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else {
        input.value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
}
