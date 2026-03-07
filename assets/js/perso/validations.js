let contactForm = document.getElementById('form_content');
let fields = document.querySelectorAll('input[required]');

fields.forEach((field) => {
    field.addEventListener('focus',() => { resetField(field)}, false);
    field.addEventListener('blur',() => { resetField(field)}, false);
});


contactForm.addEventListener('submit',(e) => {
    e.preventDefault();
   fields.forEach((field) => { resetField(field) });
   let valid = true;

    fields.forEach((field)=> {
    if(! validateField(field)){
        valid = false;
    }

    });
    if (valid) {
        e.target.submit()
    }

},false);
invalid

function validateField(field) {
    if (field.checkValidity()) {
        return true;
    } else {
        field.classList.add('invalid');
        field.previousElementSibling.insertAdjacentHTML('beforeend',`<span class="msg">${field.validationMessage}</span>`);
        return false;
    }
}

function resetField(field){
    let fieldLabel = field.previousElementSibling;
    field.classList.remove('invalid');
   while(fieldLabel.firstElementChild){
    fieldLabel.removeChild(fieldLabel.firstElementChild);
   }
   field.valid = true;
}

alert("stop");

let enregistrer = document.getElementById('enregistrer');
enregistrer.addEventListener('submit',function(){
    preventDefault();
    alert("stop");
});