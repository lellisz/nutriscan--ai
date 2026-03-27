// Camada de dados — Templates de refeições brasileiras
// Macros baseados na TACO (Tabela Brasileira de Composição Alimentar)

export const BR_MEAL_TEMPLATES = [
  // ALMOÇO / JANTAR
  { id:'prato-feito-frango', name:'Prato feito — frango grelhado', category:'almoco', defaultPortion:450, portionLabel:'1 prato', portionStep:50, macros:{calories:520,protein:42,carbs:65,fat:8}, tags:['high-protein','sem-gluten'], adjustable:true, description:'Arroz, feijão, frango grelhado e salada' },
  { id:'prato-feito-carne', name:'Prato feito — carne bovina', category:'almoco', defaultPortion:450, portionLabel:'1 prato', portionStep:50, macros:{calories:550,protein:40,carbs:65,fat:12}, tags:[], adjustable:true, description:'Arroz, feijão, bife e salada' },
  { id:'marmita-fitness', name:'Marmita fitness', category:'almoco', defaultPortion:380, portionLabel:'1 marmita', portionStep:50, macros:{calories:420,protein:45,carbs:48,fat:6}, tags:['high-protein','low-fat'], adjustable:true, description:'Frango, batata-doce e legumes no vapor' },
  { id:'feijoada', name:'Feijoada completa', category:'almoco', defaultPortion:500, portionLabel:'1 prato fundo', portionStep:100, macros:{calories:680,protein:38,carbs:72,fat:24}, tags:['tipico-br'], adjustable:true, description:'Feijão preto, carnes, arroz e farofa' },
  { id:'macarrao-bolonhesa', name:'Macarrão à bolonhesa', category:'jantar', defaultPortion:350, portionLabel:'1 prato', portionStep:50, macros:{calories:580,protein:28,carbs:82,fat:14}, tags:[], adjustable:true, description:'Macarrão com molho de carne moída' },
  { id:'arroz-ovo-frito', name:'Arroz com ovo frito', category:'almoco', defaultPortion:280, portionLabel:'1 prato', portionStep:50, macros:{calories:460,protein:18,carbs:68,fat:14}, tags:[], adjustable:true, description:'Arroz branco, ovo frito e feijão' },
  { id:'frango-molho-arroz', name:'Frango ao molho com arroz', category:'jantar', defaultPortion:380, portionLabel:'1 prato', portionStep:50, macros:{calories:490,protein:38,carbs:58,fat:12}, tags:['high-protein'], adjustable:true, description:'Frango ao molho pardo com arroz branco' },

  // CAFÉ DA MANHÃ
  { id:'cafe-basico', name:'Café da manhã básico', category:'cafe-da-manha', defaultPortion:200, portionLabel:'1 refeição', portionStep:0, macros:{calories:320,protein:10,carbs:48,fat:8}, tags:[], adjustable:false, description:'Café com leite, pão com manteiga e fruta' },
  { id:'tapioca-ovo', name:'Tapioca com ovo', category:'cafe-da-manha', defaultPortion:200, portionLabel:'1 tapioca', portionStep:0, macros:{calories:360,protein:22,carbs:42,fat:10}, tags:['sem-gluten'], adjustable:false, description:'Tapioca recheada com ovo mexido' },
  { id:'vitamina-banana', name:'Vitamina de banana', category:'cafe-da-manha', defaultPortion:300, portionLabel:'1 copo', portionStep:50, macros:{calories:280,protein:10,carbs:52,fat:4}, tags:[], adjustable:true, description:'Vitamina de banana com leite e aveia' },
  { id:'pao-de-queijo', name:'Pão de queijo', category:'cafe-da-manha', defaultPortion:120, portionLabel:'4 unidades', portionStep:30, macros:{calories:340,protein:8,carbs:46,fat:14}, tags:['sem-gluten'], adjustable:true, description:'Pão de queijo mineiro assado' },
  { id:'mingau-aveia', name:'Mingau de aveia', category:'cafe-da-manha', defaultPortion:250, portionLabel:'1 tigela', portionStep:50, macros:{calories:260,protein:10,carbs:46,fat:4}, tags:[], adjustable:true, description:'Mingau cremoso de aveia com canela' },

  // LANCHE
  { id:'sanduiche-natural', name:'Sanduíche natural', category:'lanche', defaultPortion:180, portionLabel:'1 sanduíche', portionStep:0, macros:{calories:320,protein:24,carbs:36,fat:6}, tags:[], adjustable:false, description:'Pão integral, frango, cenoura e requeijão' },
  { id:'iogurte-granola', name:'Iogurte com granola', category:'lanche', defaultPortion:200, portionLabel:'1 tigela', portionStep:50, macros:{calories:280,protein:16,carbs:34,fat:8}, tags:[], adjustable:true, description:'Iogurte natural com granola e mel' },
  { id:'frutas-mistas', name:'Frutas mistas', category:'lanche', defaultPortion:300, portionLabel:'1 porção', portionStep:50, macros:{calories:180,protein:2,carbs:44,fat:0}, tags:['sem-gluten','vegan'], adjustable:true, description:'Mix de frutas da estação' },
  { id:'acai-tigela', name:'Açaí na tigela', category:'lanche', defaultPortion:300, portionLabel:'1 tigela', portionStep:50, macros:{calories:520,protein:8,carbs:82,fat:16}, tags:['tipico-br','sem-gluten'], adjustable:true, description:'Açaí batido com granola e banana' },
  { id:'iogurte-simples', name:'Iogurte natural simples', category:'lanche', defaultPortion:170, portionLabel:'1 pote', portionStep:0, macros:{calories:120,protein:8,carbs:12,fat:4}, tags:[], adjustable:false, description:'Iogurte natural integral' },

  // PÓS-TREINO
  { id:'shake-whey', name:'Shake de whey', category:'pos-treino', defaultPortion:400, portionLabel:'1 shake', portionStep:0, macros:{calories:260,protein:30,carbs:26,fat:2}, tags:['high-protein'], adjustable:false, description:'Whey protein com leite ou água' },
  { id:'frango-batata-doce', name:'Frango com batata-doce', category:'pos-treino', defaultPortion:320, portionLabel:'1 prato', portionStep:50, macros:{calories:380,protein:42,carbs:40,fat:4}, tags:['high-protein','sem-gluten'], adjustable:true, description:'Peito de frango grelhado com batata-doce cozida' },
  { id:'omelete-proteica', name:'Omelete proteica', category:'pos-treino', defaultPortion:250, portionLabel:'1 omelete', portionStep:0, macros:{calories:320,protein:36,carbs:4,fat:16}, tags:['high-protein','low-carb','sem-gluten'], adjustable:false, description:'Omelete de 4 ovos com queijo e atum' },
  { id:'banana-pasta-amendoim', name:'Banana com pasta de amendoim', category:'pos-treino', defaultPortion:200, portionLabel:'1 porção', portionStep:0, macros:{calories:300,protein:8,carbs:40,fat:12}, tags:['sem-gluten','vegan'], adjustable:false, description:'Banana com 2 colheres de pasta de amendoim' },

  // TÍPICOS
  { id:'coxinha', name:'Coxinha de frango', category:'lanche', defaultPortion:130, portionLabel:'1 unidade grande', portionStep:0, macros:{calories:380,protein:14,carbs:46,fat:16}, tags:['tipico-br'], adjustable:false, description:'Coxinha frita de frango com requeijão' },
  { id:'esfiha-carne', name:'Esfiha de carne', category:'lanche', defaultPortion:80, portionLabel:'1 unidade', portionStep:0, macros:{calories:220,protein:10,carbs:28,fat:6}, tags:['tipico-br'], adjustable:false, description:'Esfiha aberta de carne moída temperada' },
  { id:'acaraje', name:'Acarajé', category:'almoco', defaultPortion:250, portionLabel:'1 unidade', portionStep:0, macros:{calories:580,protein:14,carbs:62,fat:30}, tags:['tipico-br','sem-gluten'], adjustable:false, description:'Bolinho de feijão fradinho frito com vatapá e camarão' },
  { id:'brigadeiro', name:'Brigadeiro', category:'lanche', defaultPortion:25, portionLabel:'1 unidade', portionStep:25, macros:{calories:100,protein:2,carbs:14,fat:4}, tags:['tipico-br'], adjustable:true, description:'Brigadeiro de chocolate tradicional' },
];

/** Retorna templates de uma categoria específica */
export function getTemplatesByCategory(category) {
  return BR_MEAL_TEMPLATES.filter(t => t.category === category);
}

/** Sugestões de templates baseadas no horário atual */
export function getSuggestedTemplates(hour) {
  if (hour >= 5 && hour < 10) return getTemplatesByCategory('cafe-da-manha').slice(0, 3);
  if (hour >= 10 && hour < 15) return getTemplatesByCategory('almoco').slice(0, 3);
  if (hour >= 15 && hour < 18) return getTemplatesByCategory('lanche').slice(0, 3);
  if (hour >= 18 && hour < 22) return getTemplatesByCategory('jantar').slice(0, 3);
  return BR_MEAL_TEMPLATES.filter(t => t.tags.includes('tipico-br')).slice(0, 3);
}

/** Escala macros proporcionalmente a uma nova porção */
export function scaleMacros(template, newPortion) {
  const ratio = newPortion / template.defaultPortion;
  return {
    calories: Math.round(template.macros.calories * ratio),
    protein:  Math.round(template.macros.protein  * ratio),
    carbs:    Math.round(template.macros.carbs    * ratio),
    fat:      Math.round(template.macros.fat      * ratio),
  };
}
