'use strict';
window.MAGE_CONFIG = Object.freeze({
  version:5, saveKey:'mage-rising-v01', killsPerStage:100, hpGrowth:1.1, normalHPGrowth:1.24809265, bossHPGrowthStep:0.003, goldGrowth:1.2,
  // Stage-only correction: interpolate multipliers, never read player power or equipment.
  bossHPAnchors:[[1,1],[5,3],[10,12],[20,60],[30,15],[50,2],[75,1]],
  baseGold:10, baseEnemyHP:60, bossBaseHP:17.5, baseEnemyAttack:1, bossHP:10, bossHPStep:2, bossAttack:2,
  basePlayerHP:100, baseMana:10, startGold:120, enemyAttackInterval:1.7,
  basePackInterval:2.1, packIntervalStep:0.01, minPackInterval:0.5, enemySpeedMultiplier:1.08, maxEnemies:54, maxStage:1000,
  regenPerSecond:0.0025, inventoryLimit:140, upgradeBaseCost:4, upgradeCostGrowth:1.028,
  spells:[
    {name:'에너지볼트',en:'ENERGY BOLT',trait:'마력 충격',traitText:'적을 밀침 · 같은 적 1초 간격 · 보스 면역',symbol:'✧',color:'#90cfff',radius:48,description:'마력탄이 터지며 주변 적에게 함께 피해를 줍니다.'},
    {name:'매직 애로우',en:'MAGIC ARROW',trait:'약점 표식',traitText:'3초간 다음 명중 피해 +10% · 중첩 없음',symbol:'➶',color:'#c2adff',radius:72,description:'빛의 화살이 착탄 지점에서 마력을 펼칩니다.'},
    {name:'아이스 스피어',en:'ICE SPEAR',trait:'빙결',traitText:'3회 명중 시 빙결 · 보스 짧게 적용',symbol:'❄',color:'#85ebef',radius:86.4,description:'얼음창이 깨지며 주변 적을 덮칩니다.'},
    {name:'프로스트 노바',en:'FROST NOVA',trait:'빙결',traitText:'3회 명중 시 빙결 · 접근 둔화',symbol:'✳',color:'#d0f9ff',radius:103.68,description:'서리 고리가 퍼지며 적들의 발을 묶습니다.'},
    {name:'체인 라이트닝',en:'CHAIN LIGHTNING',trait:'마비',traitText:'짧은 이동·공격 정지 · 재발동 대기',symbol:'ϟ',color:'#e6ceff',radius:124.416,description:'범위 안 적들을 빛나는 번개로 연결합니다.'},
    {name:'썬더스톰',en:'THUNDERSTORM',trait:'마비',traitText:'짧은 이동·공격 정지 · 보스 저항',symbol:'☇',color:'#b5baff',radius:149.2992,description:'뇌운에서 쏟아지는 낙뢰가 전장을 밝힙니다.'},
    {name:'플레임 토네이도',en:'FLAME TORNADO',trait:'화상',traitText:'3초간 초당 타격 피해의 10% · 중첩 없음',symbol:'♨',color:'#ffba7a',radius:179.15904,description:'불꽃 회오리가 적 무리를 휩씁니다.'},
    {name:'메테오',en:'METEOR',trait:'화상',traitText:'3초간 초당 타격 피해의 10% · 중첩 없음',symbol:'☄',color:'#ff906f',radius:214.990848,description:'거대한 운석과 충격파로 적을 무너뜨립니다.'},
    {name:'스타폴',en:'STARFALL',trait:'별빛 공명',traitText:'3회 명중 시 60% 추가 범위 폭발',symbol:'✴',color:'#a1dcff',radius:257.9890176,description:'청백색 유성우가 넓은 전장에 쏟아집니다.'},
    {name:'블랙홀',en:'BLACK HOLE',trait:'중력 흡입',traitText:'범위 안 적을 모음 · 보스 면역',symbol:'◉',color:'#dc9cff',radius:309.58682112,description:'공허의 중심이 적을 끌어당기고 붕괴합니다.'}
  ],
  skins:[
    {id:'default',name:'젊은 마법사',path:'assets/skins/default-mage.png',description:'여정을 시작한 젊은 마법사',color:'#bdacff',builtin:true},
    {id:'blonde',builtin:true,simple:true,name:'금빛 여마법사',path:'assets/skins/blonde-simple.png',description:'금발 · 보랏빛 탱크톱과 짧은 치마',color:'#e4ba79',tipX:.88,tipY:.11},
    {id:'elder',builtin:true,simple:true,name:'백발의 현자',path:'assets/skins/elder-simple.png',description:'흰 수염 · 회색 로브와 나무 지팡이',color:'#d1d9e6',tipX:.9,tipY:.12},
    {id:'elf',builtin:true,simple:true,name:'숲의 엘프',path:'assets/skins/elf-simple.png',description:'은발 · 긴 귀와 녹색 마법 예복',color:'#93c99b',tipX:.88,tipY:.12},
    {id:'demon',builtin:true,simple:true,name:'심연의 마법사',path:'assets/skins/demon-simple.png',description:'뿔과 꼬리 · 검붉은 마법 예복',color:'#dc939d',tipX:.89,tipY:.11}
  ],
  slots:[{id:'staff',name:'지팡이',stat:'마법공격력',kind:'magicAtk'},{id:'cloak',name:'망토',stat:'체력',kind:'hp'},{id:'ring',name:'반지',stat:'시전시간',kind:'cast'},{id:'necklace',name:'목걸이',stat:'쿨타임',kind:'cooldown'},{id:'gloves',name:'장갑',stat:'치명타 확률',kind:'crit'},{id:'boots',name:'부츠',stat:'이동속도',kind:'move'},{id:'helmet',name:'투구',stat:'방어력',kind:'armor'}],
  uniques:[
    {name:'별을 꿰는 지팡이',effect:'보스 피해 +10%'},
    {name:'새벽의 망토',effect:'부활 시 최대 체력 10% 보호막'},
    {name:'공명의 반지',effect:'마법 반경 +5%'},
    {name:'황금빛 목걸이',effect:'몬스터 처치 골드 +5%'},
    {name:'마력 직조 장갑',effect:'치명타 피해 +20%p'},
    {name:'순례자의 부츠',effect:'보스 처치 시 최대 HP 10% 추가 회복'},
    {name:'수호자의 왕관',effect:'최대 체력 +10%'}
  ],
  rarities:[{name:'일반',color:'#afbacb',mult:1},{name:'고급',color:'#82ddbb',mult:1.3},{name:'희귀',color:'#8eafff',mult:1.7},{name:'유니크',color:'#e0a9ff',mult:3.2}],
  biomes:[{name:'달빛 숲',top:'#171b36',bottom:'#293846',ground:'#15232f',moon:'#c8baff'}, {name:'서리의 계곡',top:'#13283c',bottom:'#365567',ground:'#213846',moon:'#a8e9ee'}, {name:'황혼의 유적',top:'#2c1935',bottom:'#553945',ground:'#342631',moon:'#ffc9a0'}, {name:'별이 잠든 황야',top:'#201e42',bottom:'#363757',ground:'#22233a',moon:'#dbb1ff'}, {name:'공허의 경계',top:'#180d2b',bottom:'#3d2451',ground:'#23132e',moon:'#f0adff'}]
});
