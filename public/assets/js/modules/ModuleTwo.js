define([
    'modules/moduleOne'
], function(moduleOne){

    function Family(){}

    Family.prototype.getMembers = function(){
        console.log( moduleOne );

        var div = document.createElement('div' );
        var body = document.getElementsByTagName('body')[0];
        div.textContent = moduleOne.familyMembers.join(', ');

        body.appendChild(div);
    };

    return Family;
});
