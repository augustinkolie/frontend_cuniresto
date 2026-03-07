function cal_prix_prod(qte,PU){
    return qte*PU;
}
function mettreAjourPrix(produit){
    let qteInput = produit.querySelector('.qte');
    let PUspam = produit.querySelector('pu');
    let pt = produit.querySelector('.pp');

    qteInput.addEventListner('input',function(){
        let qte = parseInt(qteInput.value,10);
        let pu = parseFloat(PUspam.textContent);
        prix_total = cal_prix_prod(qte,pu);
        pt.textContent 
    })
}

