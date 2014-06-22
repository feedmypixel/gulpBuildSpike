require([
    'modules/ModuleTwo'
], function(ModuleTwo){
    var family = new ModuleTwo();
    family.getMembers();
});