'use strict';
// Additive fifth job. Existing class definitions and save keys are untouched.
window.MAGE_CLASSES.jobs.gunner={name:'총사',icon:'⌖',first:'m855'};
window.MAGE_GUNNER_SHOTS=[
 {id:'rapidShot',name:'속사',family:'energy',coef:.18,cast:.12,color:'#efd49c'},
 {id:'sniperShot',name:'드론',family:'fire',coef:.09,cast:.12,color:'#bedef3'},
 {id:'artilleryShot',name:'포격',family:'ice',coef:4.5,cast:3,color:'#c2d2a8'}
].map(n=>({...n,type:'intrinsic',cd:0,radius:n.id==='artilleryShot'?90:0,rank:1,en:n.name,description:'고정 자동 공격 · 속사/드론은 다음 적마다80% 확률 직선 관통 · 파편은 첫 명중만 · 탄종/부품 특성 누적 적용'}));
window.MAGE_CLASSES.data.gunner=[
 ['energy','속사',[
 ['m855','M855A1 EPR','속사 피해 +5%/Lv'],
 ['gasRegulator','가스 조절기','속사 공속 +8%p/Lv · 최대40%p'],
 ['tracer','M856A1 Tracer','속사 적중 시 3초 표식 · 최대5중첩 · 중첩당 직접탄 피해 +0.4%×Lv · 최대20%'],
 ['zeroing','조준경 영점 조정','속사 치명타 확률 +2%p/Lv · 최대10%p · 최종 상한60%'],
 ['m995','M995 AP · 파편탄','원탄 방어 무시 +2%p/Lv(최대20%) 유지 · 탄환의 첫 명중에서만 원형 범위의 다른 적 전부에 원탄 기본 피해25% · 대상 수 제한 없음 · 원탄 대상 제외 · 반경120~210(+장비 범위) · 중복/재분열/추가 충전 없음']]],
 // Legacy IDs retain each node's invested levels, costs and prerequisites.
 ['fire','드론',[
 ['m118','지원사격 프로토콜','Lv1 드론1대 활성화 · 속사와 같은 주기/패시브 · 기본 피해는 속사의50% · 추가Lv당 드론 사격 피해+5% · 자체 전원, 탄약/초월 충전 소모 없음'],
 ['laserSight','표적 공유','최근3초 안에 본체 속사에 맞은 적에게 드론 원탄 피해 +4%/Lv'],
 ['m993','펄스 레이저','6초마다 직선 관통 레이저 · 피해 공격력×(2+추가Lv×0.2) · 경로의 모든 적 · 파편/표식/추가 충전 없음'],
 ['longBarrel','축전 회로','레이저 간격 -0.4초/Lv · 최대5Lv, 최단4초 · 재장전과 독립'],
 ['raufoss','과충전 렌즈','레이저 피해 +5%/Lv · 판정 폭 +3%/Lv']]],
 ['ice','포격',[
 ['m795','M795 HE','포격 피해 +5%/Lv · 반경 +3%/Lv'],
 ['autoFeed','자동 송탄장치','포격 공속 +5%p/Lv · 최대25%p'],
 ['dpicm','M864 DPICM','자탄2~5개 · 개당 기본 포격 피해10% · 탄약 소모 +1'],
 ['fireControl','사격통제장치','폭발 중심 1/3 안쪽 피해 +5%/Lv'],
 ['excalibur','M982 Excalibur','보스 우선 조준 · 주 폭발 보스 피해 +3%/Lv · 탄약 소모 +1']]],
 ['lightning','급탄',[
 ['quickReload','신속 장전','재장전 시간 -4%/Lv · 최대40% 감소'],
 ['feedUpgrade','급탄기 개량','포격 소모3발 이상일 때 4%×Lv 확률(최대20%)로 1발 반환'],
 ['extendedMag','확장 탄창','최대 탄약 +5발/Lv · 배우면 다음 장전부터 적용'],
 ['ammoRecovery','잔탄 회수','기본 사격 시 2%×Lv 확률(최대10%)로 1발 반환 · 포격 실소모 최소2발'],
 ['ammoBelt','대용량 탄띠','최대 탄약 +5%/Lv · 다음 장전부터 적용']]],
 ['cosmic','초월',[
 ['nuclear','Nuclear','기본 사격30회마다 추가 핵폭발 · 피해2+0.3×(Lv−1)배 · 2차 피해 재발동 없음'],
 ['enrichment','농축','Nuclear 피해 +10%/Lv · 반경 +4%/Lv'],
 ['tacticalStrike','전술폭격','사격300회 충전 후 버튼으로 사용 · 전체 피해18+2×(Lv−1)배를 3회 분할 · 새 무리는 제외']]]
].map(([id,name,list],ti)=>({id,name,color:['#efd49c','#bedef3','#c2d2a8','#d7b9e8','#ffd28e'][ti],nodes:list.map(([nid,nm,description],i)=>({id:nid,name:nm,en:nm,family:id,type:'passive',max:ti===4?[10,5,10][i]:[10,5,10,5,10][i],cost:ti===4?[4,2,5][i]:[1,1,2,1,3][i],rank:ti===4?[4,0,5][i]:Math.floor(i/2)+1,color:['#efd49c','#bedef3','#c2d2a8','#d7b9e8','#ffd28e'][ti],description,coef:0,cast:0,cd:0,radius:0}))}));
