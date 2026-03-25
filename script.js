function closeModal(id){var el=document.getElementById(id);if(el)el.classList.remove('op');}
function openModal(id){var el=document.getElementById(id);if(el)el.classList.add('op');}

var LT='admin',RT='user',ROLE='admin',USER=null;
var CHARTS_OK=false,YE_DONE={},CHAT_OPEN=false,CHAT_HIST=[],CHAT_BUSY=false;
var CC=142,CS=1,LR=0,LM=false;
var REVIEWED={},DECIDED={};

/* NAV CONFIG */
var NAV={
  agent:[{i:'&#128202;',l:'Dashboard',k:'aDash'},{i:'&#43;',l:'Submit Claim',k:'aNew'},{i:'&#128193;',l:'My Claims',k:'aMy'},{i:'&#128197;',l:'Year-End Report',k:'aYE'}],
  investigator:[{i:'&#128202;',l:'Dashboard',k:'iDash'},{i:'&#128270;',l:'Review Claims',k:'iReview'},{i:'&#128203;',l:'Investigation Queue',k:'iQueue'},{i:'&#9881;',l:'Analysis Tools',k:'iAnalysis'},{i:'&#128197;',l:'Year-End Report',k:'iYE'}],
  admin:[{i:'&#128202;',l:'Overview',k:'admDash'},{i:'&#10003;',l:'Approve / Reject',k:'admApprove'},{i:'&#128193;',l:'All Claims',k:'admClaims'},{i:'&#128101;',l:'User Management',k:'admUsers'},{i:'&#128197;',l:'Year-End Report',k:'admYE'}]
};
var TABS={agent:['aDash','aNew','aMy','aYE'],investigator:['iDash','iReview','iQueue','iAnalysis','iYE'],admin:['admDash','admApprove','admClaims','admUsers','admYE']};
var RLABEL={agent:'Insurance Agent - Can Submit Claims',investigator:'Fraud Investigator - Can Review & Flag',admin:'System Administrator - Can Approve & Reject'};
var RPERMS={agent:'Submit claims only. Cannot review or approve.',investigator:'Review claims, flag fraud, clear legitimate ones. Cannot approve/reject.',admin:'Full access. Final approval and rejection authority.'};
var PENDING_REVIEW=[];
var PENDING_APPROVAL=[];

/* AUTH */
function setLT(t){LT=t;document.getElementById('lt_admin').classList.toggle('on',t==='admin');document.getElementById('lt_user').classList.toggle('on',t==='user');document.getElementById('lSub').classList.toggle('hidden',t!=='user');document.getElementById('lEmail').value=t==='admin'?'admin@company.com':'user@company.com';}
function setRT(t){RT=t;document.getElementById('rt_admin').classList.toggle('on',t==='admin');document.getElementById('rt_user').classList.toggle('on',t==='user');document.getElementById('rSubWrap').style.display=t==='user'?'block':'none';}
function showReg(){document.getElementById('loginScreen').classList.add('hidden');document.getElementById('regScreen').classList.remove('hidden');}
function showLogin(){document.getElementById('regScreen').classList.add('hidden');document.getElementById('loginScreen').classList.remove('hidden');}
function doLogin(){var e=document.getElementById('lEmail').value.trim(),p=document.getElementById('lPass').value;if(!e||!p){alert('Please fill all fields');return;}if(LT==='admin'){ROLE='admin';USER={name:'Admin Singh',role:'admin'};}else{var s=document.getElementById('lSubRole').value;ROLE=s;USER={name:s==='investigator'?'Divya Patel':'Rahul Mehta',role:s};}launch();}
function doReg(){var f=document.getElementById('rFirst').value.trim(),l=document.getElementById('rLast').value.trim(),e=document.getElementById('rEmail').value.trim(),p=document.getElementById('rPass').value,p2=document.getElementById('rPass2').value;if(!f||!l||!e||!p){alert('Please fill required fields');return;}if(p!==p2){alert('Passwords do not match');return;}if(RT==='admin'){ROLE='admin';USER={name:f+' '+l,role:'admin'};}else{var s=document.getElementById('rSubRole').value;ROLE=s;USER={name:f+' '+l,role:s};}launch();}
function doLogout(){document.getElementById('dashboard').classList.add('hidden');document.getElementById('loginScreen').classList.remove('hidden');CHARTS_OK=false;YE_DONE={};CHAT_HIST=[];CHAT_OPEN=false;CHAT_BUSY=false;CS=1;document.getElementById('msgs').innerHTML='';document.getElementById('chips').innerHTML='';document.getElementById('chatFab').classList.remove('show');document.getElementById('chatWin').classList.remove('op');setLT('admin');}

/* LAUNCH */
function launch(){document.getElementById('loginScreen').classList.add('hidden');document.getElementById('regScreen').classList.add('hidden');document.getElementById('dashboard').classList.remove('hidden');var pts=USER.name.split(' '),ini=(pts[0][0]+(pts[1]?pts[1][0]:'')).toUpperCase();['sAv','prAv'].forEach(function(id){document.getElementById(id).textContent=ini;});document.getElementById('sName').textContent=USER.name;document.getElementById('sRole').textContent=ROLE==='admin'?'Administrator':ROLE==='investigator'?'Fraud Investigator':'Insurance Agent';document.getElementById('prName').textContent=USER.name;document.getElementById('prRole').textContent=RLABEL[ROLE];document.getElementById('prPerms').textContent=RPERMS[ROLE];var nav=document.getElementById('navItems');nav.innerHTML=NAV[ROLE].map(function(item){return '<div class="ni" data-key="'+item.k+'" onclick="sTab(\''+item.k+'\',\''+ROLE+'\');setNE(this)">'+item.i+' '+item.l+'</div>';}).join('');nav.querySelector('.ni').classList.add('on');['agentView','investigatorView','adminView'].forEach(function(id){document.getElementById(id).classList.add('hidden');});document.getElementById(ROLE+'View').classList.remove('hidden');setTimeout(initCharts,100);document.getElementById('chatFab').classList.add('show');startClock();setTimeout(populatePanelsFromQueue,200);}

function setNE(el){document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('on');});el.classList.add('on');}
function setNK(k){document.querySelectorAll('.ni').forEach(function(n){n.classList.toggle('on',n.dataset&&n.dataset.key===k);});}
function sTab(id,role){var view=document.getElementById(role+'View');view.querySelectorAll('.section').forEach(function(s){s.classList.remove('on');});var sec=document.getElementById(id);if(sec)sec.classList.add('on');TABS[role].forEach(function(k,i){var t=view.querySelectorAll('.tab')[i];if(t)t.classList.toggle('on',k===id);});if(id==='aYE')renderYE('yeA');if(id==='iYE')renderYE('yeI');if(id==='admYE')renderYE('yeAdm');if(id!=='aNew')resetForm();}

/* INVESTIGATOR ACTIONS - Review claims */
function takeAction(cardId, action, claimId){
  var card=document.getElementById('rc_'+cardId);
  if(!card)return;
  REVIEWED[cardId]=action;
  /* Remove from PENDING_REVIEW */
  PENDING_REVIEW=PENDING_REVIEW.filter(function(c){return c.cardId!==cardId;});
  /* Push to PENDING_APPROVAL for admin */
  var badge=action==='fraud'?'br':action==='flagged'?'ba':'bt';
  var invNote=action==='fraud'?'Recommend rejection - likely fraud':action==='flagged'?'Flagged suspicious - admin scrutiny needed':'Verified - cleared for approval';
  PENDING_APPROVAL.unshift({claimId:claimId,cardId:cardId,action:action,badge:badge,invNote:invNote,investigator:USER?USER.name:'Investigator'});
  var msg='',cls='';
  if(action==='cleared'){msg='Cleared as low risk - sent to Admin for approval.';cls='as2';}
  else if(action==='flagged'){msg='Flagged as suspicious - sent to Admin with your note.';cls='aw2';}
  else{msg='Marked as probable fraud - sent to Admin with investigation report.';cls='ae';}
  card.innerHTML='<div class="alert '+cls+'" style="margin:0">'+claimId+' '+msg+'</div>';
  setTimeout(function(){card.style.opacity='0';card.style.transition='opacity .4s';setTimeout(function(){card.remove();checkAllReviewed();},400);},1800);
  showToast(claimId+' sent to Admin');}
function checkAllReviewed(){var box=document.getElementById('reviewCardsBox');if(box&&box.children.length===0){document.getElementById('allReviewedMsg').classList.remove('hidden');}}

/* ADMIN ACTIONS - Final approval/rejection */
function admDecision(cardId, action, claimId){
  var card=document.getElementById('ac_'+cardId);
  if(!card)return;
  DECIDED[cardId]=action;
  PENDING_APPROVAL=PENDING_APPROVAL.filter(function(c){return c.cardId!==cardId;});
  var msg='',cls='';
  if(action==='approved'){msg='Claim approved - payment will be processed.';cls='as2';}
  else if(action==='rejected'){msg='Claim rejected - policyholder will be notified.';cls='ae';}
  else{msg='Returned for re-investigation by fraud investigator.';cls='aw2';}
  card.innerHTML='<div class="alert '+cls+'" style="margin:0">'+claimId+' '+msg+'</div>';
  var pc=document.getElementById('pendingCount');if(pc)pc.textContent=Math.max(0,(parseInt(pc.textContent)||12)-1);
  setTimeout(function(){card.style.opacity='0';card.style.transition='opacity .4s';setTimeout(function(){card.remove();checkAllDecided();},400);},1800);
  showToast(claimId+' decision recorded');}
function checkAllDecided(){var box=document.getElementById('approveCardsBox');if(box&&box.children.length===0){document.getElementById('allApprovedMsg').classList.remove('hidden');}}

/* CLAIM FORM - Agent only */
function gStep(n){if(n>CS){if(CS===1&&!vS1())return;if(CS===2&&!vS2())return;if(CS===3&&!vS3())return;}CS=n;[1,2,3].forEach(function(i){var el=document.getElementById('cS'+i);if(el)el.classList.toggle('hidden',i!==n);var si=document.getElementById('cs'+i);if(si){si.classList.remove('dn2','on2');if(i<n)si.classList.add('dn2');else if(i===n)si.classList.add('on2');}});if(n===3)buildSumm();document.getElementById('caBox').innerHTML='';}
function vS1(){var p=document.getElementById('fPol').value.trim(),t=document.getElementById('fType').value,n=document.getElementById('fName').value.trim();sE('fPol','ePol',!p);sE('fType','eType',!t);sE('fName','eName',!n);return !!(p&&t&&n);}
function vS2(){var d=document.getElementById('fDate').value.trim(),a=document.getElementById('fAmt').value.trim(),dc=document.getElementById('fDesc').value.trim();sE('fDate','eDate',!d);sE('fAmt','eAmt',!a);sE('fDesc','eDesc',!dc);return !!(d&&a&&dc);}
function vS3(){var d=document.getElementById('fDoc').value;sE('fDoc','eDoc',!d);return !!d;}
function sE(inp,err,isE){var i=document.getElementById(inp),e=document.getElementById(err);if(i)i.classList.toggle('err',isE);if(e)e.classList.toggle('hidden',!isE);}
// ML API Configuration
const ML_API_URL = 'http://localhost:5000/predict';
const USE_ML_MODEL = true; // Set to false to use rule-based system

// ML-based risk calculation
async function lR_ML() {
    var ty = document.getElementById('fType') ? document.getElementById('fType').value : '';
    var am = parseFloat(((document.getElementById('fAmt') ? document.getElementById('fAmt').value : '') || '0').replace(/,/g, ''));
    var pr = parseInt((document.getElementById('fPrev') ? document.getElementById('fPrev').value : '0') || '0');
    var tp = (document.getElementById('fTP') ? document.getElementById('fTP').value : 'no');
    var ds = ((document.getElementById('fDesc') ? document.getElementById('fDesc').value : '') || '');
    
    // Prepare data for ML model
    const claimData = {
        claim_type: ty,
        claim_amount: am,
        prior_claims: pr,
        third_party: tp,
        description: ds,
        policy_age_days: 365, // Default value
        claimant_age: 35, // Default value
        incident_hour: 12, // Default value
        has_witness: 'no'
    };
    
    try {
        const response = await fetch(ML_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(claimData)
        });
        
        if (!response.ok) {
            throw new Error('ML API request failed');
        }
        
        const result = await response.json();
        
        if (result.success) {
            const sc = result.prediction.risk_score;
            const fl = result.risk_factors.map(rf => ({
                t: rf.factor,
                d: rf.severity === 'high'
            }));
            
            LR = sc;
            updateRiskUI(sc, fl, 'XGBoost ML Model');
            return;
        }
    } catch (error) {
        console.warn('ML API failed, falling back to rule-based:', error);
        // Fall back to rule-based if ML fails
        lR_RuleBased();
    }
}

// Original rule-based risk calculation
function lR_RuleBased() {
    var sc = 0, fl = [];
    var ty = document.getElementById('fType') ? document.getElementById('fType').value : '';
    var am = parseFloat(((document.getElementById('fAmt') ? document.getElementById('fAmt').value : '') || '0').replace(/,/g, ''));
    var pr = parseInt((document.getElementById('fPrev') ? document.getElementById('fPrev').value : '0') || '0');
    var tp = (document.getElementById('fTP') ? document.getElementById('fTP').value : 'no');
    var ds = ((document.getElementById('fDesc') ? document.getElementById('fDesc').value : '') || '').toLowerCase();
    
    var tr = {Motor: 10, Health: 12, Property: 15, Life: 18, Travel: 8};
    if (ty && tr[ty]) sc += tr[ty];
    
    var av = {Motor: 80000, Health: 150000, Property: 500000, Life: 1000000, Travel: 30000};
    if (ty && am > 0 && av[ty]) {
        var r = am / av[ty];
        if (r > 5) {
            sc += 35;
            fl.push({t: 'Claim extremely high vs policy average (' + Math.round(r * 100) + '%)', d: true});
        } else if (r > 2) {
            sc += 20;
            fl.push({t: 'Claim significantly above average (' + Math.round(r * 100) + '%)', d: false});
        } else if (r > 1) sc += 8;
    }
    
    if (pr >= 3) {
        sc += 30;
        fl.push({t: '3+ prior claims in 12 months', d: true});
    } else if (pr === 2) {
        sc += 18;
        fl.push({t: '2 prior claims in 12 months', d: false});
    } else if (pr === 1) {
        sc += 8;
        fl.push({t: '1 prior claim in 12 months', d: false});
    }
    
    if (tp === 'yes') {
        sc += 10;
        fl.push({t: 'Third party involved', d: false});
    }
    
    var sw = ['sudden', 'urgent', 'overnight', 'unknown', 'stranger'];
    var fw = sw.filter(function(w) { return ds.indexOf(w) >= 0; });
    if (fw.length >= 2) {
        sc += 12;
        fl.push({t: 'Suspicious keywords in description', d: true});
    }
    
    sc = Math.min(100, Math.max(0, sc));
    LR = sc;
    updateRiskUI(sc, fl, 'Rule-Based System');
}

// Update risk UI
function updateRiskUI(sc, fl, modelType) {
    var sn = document.getElementById('rNum'),
        ff = document.getElementById('rFill'),
        rl = document.getElementById('rLbl'),
        rflag = document.getElementById('rFlags');
    
    if (!sn) return;
    
    sn.textContent = sc;
    ff.style.width = sc + '%';
    
    var c, l;
    if (sc < 30) {
        c = 'var(--teal)';
        l = 'Low risk - ' + modelType;
    } else if (sc < 60) {
        c = 'var(--amber)';
        l = 'Medium risk - ' + modelType;
    } else {
        c = 'var(--red)';
        l = 'High risk - ' + modelType;
    }
    
    sn.style.color = c;
    ff.style.background = c;
    rl.textContent = l;
    rl.style.color = c;
    
    rflag.innerHTML = fl.map(function(f) {
        return '<div style="font-size:11px;color:var(--muted);padding:2px 0 2px 13px;position:relative"><span style="position:absolute;left:0;top:7px;width:6px;height:6px;border-radius:50%;background:' + (f.d ? 'var(--red)' : 'var(--amber)') + ';display:block"></span>' + f.t + '</div>';
    }).join('');
}

// Main risk calculation function
function lR() {
    if (USE_ML_MODEL) {
        lR_ML();
    } else {
        lR_RuleBased();
    }
}
function buildSumm(){lR();var el=document.getElementById('fSumm'),sc=LR,c=sc<30?'#00d4aa':sc<60?'#ffb547':'#ff5470',st=sc<30?'Low Risk - likely approved':sc<60?'Medium Risk - investigation possible':'High Risk - investigation likely',ty=(document.getElementById('fType').value||'N/A'),am=(document.getElementById('fAmt').value||'0'),nm=(document.getElementById('fName').value||'N/A'),pl=(document.getElementById('fPol').value||'N/A');el.innerHTML='<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:600;margin-bottom:9px">Submission Summary</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:11px"><div><div style="font-size:10px;color:var(--muted)">Claimant</div><div style="font-size:12.5px;font-weight:600">'+nm+'</div></div><div><div style="font-size:10px;color:var(--muted)">Policy No.</div><div style="font-size:12px;font-family:\'JetBrains Mono\',monospace">'+pl+'</div></div><div><div style="font-size:10px;color:var(--muted)">Type</div><div style="font-size:12.5px;font-weight:600">'+ty+'</div></div><div><div style="font-size:10px;color:var(--muted)">Amount</div><div style="font-size:12.5px;font-weight:600">Rs '+am+'</div></div></div><div style="display:flex;align-items:center;gap:9px;padding:9px;background:var(--surface3);border-radius:8px"><div style="font-size:24px;font-weight:700;font-family:\'JetBrains Mono\',monospace;color:'+c+'">'+sc+'<span style="font-size:12px">/100</span></div><div><div style="font-size:10px;color:var(--muted)">Risk Score</div><div style="font-size:11.5px;font-weight:600;color:'+c+'">'+st+'</div></div></div><div style="font-size:11px;color:var(--muted);margin-top:9px">After submission, this claim will be assigned to a Fraud Investigator for review. You can track progress in My Claims.</div>';}
function resetForm(){CS=1;['fPol','fType','fName','fMob','fDate','fAmt','fLoc','fDesc','fDoc','fDocRef','fWit','fNote'].forEach(function(id){var el=document.getElementById(id);if(el){el.value='';el.classList.remove('err');}});var fp=document.getElementById('fPrev');if(fp)fp.value='0';var ft=document.getElementById('fTP');if(ft)ft.value='no';var rn=document.getElementById('rNum');if(rn){rn.textContent='0';rn.style.color='var(--teal)';}var rf=document.getElementById('rFill');if(rf)rf.style.width='0%';var rl=document.getElementById('rLbl');if(rl)rl.textContent='Fill in details above';var rflag=document.getElementById('rFlags');if(rflag)rflag.innerHTML='';document.querySelectorAll('.fe').forEach(function(e){e.classList.add('hidden');});[1,2,3].forEach(function(i){var el=document.getElementById('cS'+i);if(el)el.classList.toggle('hidden',i!==1);var si=document.getElementById('cs'+i);if(si){si.classList.remove('dn2','on2');if(i===1)si.classList.add('on2');}});var ab=document.getElementById('caBox');if(ab)ab.innerHTML='';}
function subClaim(){
  if(!vS3())return;
  lR();
  var cid='CLM-'+(9000+Math.floor(Math.random()*900));
  var ty=document.getElementById('fType').value;
  var am=document.getElementById('fAmt').value;
  var nm=document.getElementById('fName').value;
  var pol=document.getElementById('fPol').value;
  var desc=(document.getElementById('fDesc').value||'').slice(0,120);
  var prevC=parseInt(document.getElementById('fPrev').value||'0');
  var thirdP=document.getElementById('fTP').value;
  var loc=document.getElementById('fLoc').value||'Not specified';
  var doc=document.getElementById('fDoc').value||'Documents submitted';
  var d=new Date(),mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var ds=d.getDate()+' '+mo[d.getMonth()];
  var sc=LR;
  var cc=sc<30?'var(--teal)':sc<60?'var(--amber)':'var(--red)';
  var agentName=USER?USER.name:'Agent';

  /* -- 1. Add to Agent: My Claims table -- */
  var row='<tr data-type="'+ty+'" data-status="Submitted" style="animation:slideUp .4s ease">'+
    '<td class="mono">'+cid+'</td><td>'+nm+'</td><td>'+ty+'</td>'+
    '<td>Rs '+am+'</td><td>'+ds+'</td>'+
    '<td style="font-size:11px;color:var(--accent)">Awaiting Investigator</td>'+
    '<td><span class="badge bb">Submitted</span></td>'+
    '<td style="color:'+cc+';font-family:\'JetBrains Mono\',monospace">'+sc+'/100</td>'+
    '</tr>';
  var tb=document.getElementById('myCB');
  if(tb)tb.insertAdjacentHTML('afterbegin',row);

  /* -- 2. Add to Agent: Recent Submissions -- */
  var rb=document.getElementById('agRecent');
  if(rb)rb.insertAdjacentHTML('afterbegin',
    '<tr><td class="mono">'+cid+'</td><td>'+ty+'</td>'+
    '<td>Rs '+am+'</td><td>'+ds+'</td>'+
    '<td style="font-size:11px;color:var(--accent)">Awaiting Investigator</td>'+
    '<td><span class="badge bb">Submitted</span></td></tr>');

  /* -- 3. Update Agent stat counters -- */
  CC++;
  var mycc=document.getElementById('myCC');if(mycc)mycc.textContent=CC;
  var aS=document.getElementById('aStT');if(aS)aS.textContent=CC;

  /* -- 4. Build review card HTML for Investigator -- */
  var cardId=cid.replace('CLM-','');
  var riskClass=sc>=70?'urgent':sc>=40?'medium':'';
  var riskLabel=sc>=70?'HIGH RISK':sc>=40?'MEDIUM RISK':'LOW RISK';
  var riskStyle=sc>=70?'color:var(--red)':sc>=40?'color:var(--amber)':'color:var(--teal)';

  /* Build detected flags list */
  var flagsHtml='';
  if(sc>=60) flagsHtml+='<div class="rc-flag d">Claim risk score '+sc+'/100 - high fraud probability</div>';
  if(prevC>=2) flagsHtml+='<div class="rc-flag d">'+prevC+' prior claim(s) in past 12 months</div>';
  if(thirdP==='yes') flagsHtml+='<div class="rc-flag">Third party involved - verify separately</div>';
  var avgMap={Motor:80000,Health:150000,Property:500000,Life:1000000,Travel:30000};
  var numAmt=parseFloat(am.replace(/[^0-9.]/g,'')||'0');
  if(avgMap[ty]&&numAmt>avgMap[ty]*1.5) flagsHtml+='<div class="rc-flag d">Claim amount above type average</div>';
  if(!flagsHtml) flagsHtml='<div class="rc-flag">No major red flags detected - routine review</div>';

  var newCard=document.createElement('div');
  newCard.className='review-card '+riskClass;
  newCard.id='rc_'+cardId;
  newCard.style.animation='slideUp .4s ease';
  newCard.innerHTML=
    '<div class="rc-top">'+
      '<div>'+
        '<div class="rc-id">'+cid+'</div>'+
        '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">Submitted by '+agentName+' &bull; '+ds+'</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div style="font-size:28px;font-weight:700;font-family:\'JetBrains Mono\',monospace;'+riskStyle+'">'+sc+'<span style="font-size:14px">/100</span></div>'+
        '<div style="font-size:10.5px;'+riskStyle+'">'+riskLabel+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="rc-body">'+
      '<div class="rc-field"><label>Claim Type</label><div class="val">'+ty+' Insurance</div></div>'+
      '<div class="rc-field"><label>Claim Amount</label><div class="val">Rs '+am+'</div></div>'+
      '<div class="rc-field"><label>Incident Location</label><div class="val">'+loc+'</div></div>'+
      '<div class="rc-field"><label>Claimant</label><div class="val">'+nm+'</div></div>'+
      '<div class="rc-field"><label>Policy No.</label><div class="val mono">'+pol+'</div></div>'+
      '<div class="rc-field"><label>Prior Claims</label><div class="val" style="'+(prevC>=2?'color:var(--red)':prevC===1?'color:var(--amber)':'color:var(--teal)')+'">'+
        (prevC===0?'None':prevC+' in last 12 months')+'</div></div>'+
    '</div>'+
    '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;background:var(--surface2);border-radius:8px;padding:9px 12px">'+
      '<span style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;font-weight:600;display:block;margin-bottom:4px">Description</span>'+
      desc+(desc.length>=120?'...':'')+
    '</div>'+
    '<div class="rc-flags"><div class="rc-flag-title">Detected Risk Factors</div>'+flagsHtml+'</div>'+
    '<div class="rc-actions">'+
      '<button class="bgreen" data-card="'+cardId+'" data-cid="'+cid+'" data-act="cleared">&#10004; Clear (Low Risk)</button>'+
      '<button class="bamb" data-card="'+cardId+'" data-cid="'+cid+'" data-act="flagged">&#9888; Flag Suspicious</button>'+
      '<button class="bred" data-card="'+cardId+'" data-cid="'+cid+'" data-act="fraud">&#10006; Mark as Fraud</button>'+
    '</div>';

  /* -- 5. Save to shared queue so investigator sees it on login -- */
  PENDING_REVIEW.unshift({
    cardId:cardId, cid:cid, ty:ty, am:am, nm:nm, pol:pol, loc:loc,
    desc:desc, prevC:prevC, thirdP:thirdP, sc:sc, agentName:agentName,
    ds:ds, riskClass:riskClass, riskLabel:riskLabel, riskStyle:riskStyle,
    flagsHtml:flagsHtml, cardHtml:newCard.outerHTML
  });

  /* -- 5b. Also inject into DOM if investigator view is currently visible -- */
  var box=document.getElementById('reviewCardsBox');
  if(box){
    var msg=document.getElementById('allReviewedMsg');
    if(msg) msg.classList.add('hidden');
    newCard.querySelectorAll('[data-act]').forEach(function(btn){
      btn.onclick=function(){takeAction(btn.dataset.card,btn.dataset.act,btn.dataset.cid);};
    });
    box.insertBefore(newCard, box.firstChild);
  }

  /* -- 6. Update Investigator dashboard counters -- */
  var invPending=document.querySelector('#iDash .sc.am .sv');
  if(invPending){
    var cur=parseInt(invPending.textContent)||0;
    invPending.textContent=cur+1;
  }
  var invAlert=document.querySelector('#iDash .alert.aw2');
  if(invAlert){
    var curCount=parseInt((invAlert.textContent.match(/\d+/)||['0'])[0])||0;
    invAlert.innerHTML=(curCount+1)+' claims are awaiting your review. <span class="al" onclick="sTab(\'iReview\',\'investigator\');setNK(\'iReview\')">Go to Review Claims &#8594;</span>';
  }

  /* -- 7. Also push to Admin: All Claims ledger -- */
  var admTb=document.querySelector('#admClaims tbody');
  if(admTb){
    admTb.insertAdjacentHTML('afterbegin',
      '<tr style="animation:slideUp .4s ease">'+
      '<td class="mono">'+cid+'</td><td>'+agentName.split(' ').map(function(p){return p[0];}).join('.')+' '+agentName.split(' ').slice(-1)[0]+'</td>'+
      '<td>'+ty+'</td><td>Rs '+am+'</td>'+
      '<td style="color:'+cc+';font-family:\'JetBrains Mono\',monospace;font-weight:700">'+sc+'</td>'+
      '<td>'+ds+'</td>'+
      '<td><span class="badge bb">Submitted</span></td>'+
      '</tr>');
  }

  /* -- 8. Notification -- */
  addNotif(cid+' submitted by agent '+agentName+' - awaiting investigator review (risk: '+sc+'/100)');

  /* -- 9. Success message and form reset -- */
  document.getElementById('caBox').innerHTML=
    '<div class="alert as2">'+
      cid+' submitted successfully! Risk score: '+sc+'/100. '+
      (sc>=60?'<strong>Flagged for priority investigation.</strong>':'Assigned to investigator review queue.')+
      ' Track status in My Claims tab.'+
    '</div>';
  setTimeout(resetForm,500);
}

/* FILTER */
function filterC(){var tf=(document.getElementById('cfType')||{}).value||'';var sf=(document.getElementById('cfSt')||{}).value||'';document.querySelectorAll('#myCB tr').forEach(function(r){var t=r.dataset.type||'',s=r.dataset.status||'';r.style.display=(!tf||t===tf)&&(!sf||s===sf)?'':'none';});}

/* ANALYSIS */
function runScore(){document.getElementById('scoreRes').classList.remove('hidden');setTimeout(function(){document.getElementById('scoreBar').style.width='87%';},80);}

/* SEARCH */
var SDATA=[{id:'CLM-8821',l:'CLM-8821 - Motor Insurance',t:'Claim',b:'bt'},{id:'CLM-8847',l:'CLM-8847 - Property (Flagged)',t:'Claim',b:'br'},{id:'CLM-8861',l:'CLM-8861 - Life Insurance',t:'Claim',b:'bt'},{id:'INV-441',l:'INV-441 - Property Investigation',t:'Case',b:'ba'},{id:'Rahul Mehta',l:'Rahul Mehta - Insurance Agent',t:'User',b:'bb'},{id:'Divya Patel',l:'Divya Patel - Fraud Investigator',t:'User',b:'bb'}];
function doSearch(q){var box=document.getElementById('sRes');if(!q||q.length<2){box.style.display='none';box.innerHTML='';return;}var res=SDATA.filter(function(d){return d.id.toLowerCase().indexOf(q.toLowerCase())>=0||d.l.toLowerCase().indexOf(q.toLowerCase())>=0;});if(!res.length){box.style.display='none';return;}box.style.display='block';box.innerHTML=res.slice(0,6).map(function(r){return '<div class="sri" onmousedown="selRes(\''+r.id+'\')"><span class="badge '+r.b+'" style="font-size:10px">'+r.t+'</span><span>'+r.l+'</span></div>';}).join('');}
function selRes(id){document.getElementById('gSearch').value=id;document.getElementById('sRes').style.display='none';showToast('Navigated to: '+id);}

/* CLOCK */
function startClock(){function t(){var d=new Date(),h=('0'+d.getHours()).slice(-2),m=('0'+d.getMinutes()).slice(-2),s=('0'+d.getSeconds()).slice(-2);document.getElementById('clk').textContent=h+':'+m+':'+s;}t();setInterval(t,1000);}

/* THEME */
function toggleTheme(){LM=!LM;document.body.classList.toggle('lm',LM);var b=document.getElementById('themeBtn'),tog=document.getElementById('thTog');if(b)b.textContent=LM?'Sun':'&#127769;';if(tog)tog.classList.toggle('on',!LM);closeAll();}

/* PANELS */
function toggleNotif(){document.getElementById('settingsPanel').classList.remove('op');document.getElementById('notifPanel').classList.toggle('op');}
function clearN(){document.querySelectorAll('.nitem.unread').forEach(function(i){i.classList.remove('unread');});document.getElementById('nd').style.display='none';document.getElementById('notifPanel').classList.remove('op');}
function toggleSettings(){document.getElementById('notifPanel').classList.remove('op');document.getElementById('settingsPanel').classList.toggle('op');}
function closeAll(){document.getElementById('notifPanel').classList.remove('op');document.getElementById('settingsPanel').classList.remove('op');}
function showShortcuts(){document.getElementById('shortcutsMod').classList.add('op');closeAll();}
function closeShortcuts(){document.getElementById('shortcutsMod').classList.remove('op');}
function showProfile(){document.getElementById('profileMod').classList.add('op');}
function closePr(){document.getElementById('profileMod').classList.remove('op');}
function doExport(){showToast('Data exported to CSV successfully');closeAll();}
function showToast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('op');setTimeout(function(){t.classList.remove('op');},2400);}

/* KEYBOARD */
document.addEventListener('keydown',function(e){if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;if(document.getElementById('dashboard').classList.contains('hidden'))return;var k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&k==='k'){e.preventDefault();document.getElementById('gSearch').focus();return;}if(k==='t')toggleTheme();else if(k==='n')toggleNotif();else if(k==='s'){e.preventDefault();toggleSettings();}else if(k==='e')doExport();else if(k==='c'){CHAT_OPEN=!CHAT_OPEN;document.getElementById('chatWin').classList.toggle('op',CHAT_OPEN);if(CHAT_OPEN&&CHAT_HIST.length===0)initBot();}else if(k==='p')showProfile();else if(k==='?')showShortcuts();else if(k==='escape'){closeShortcuts();closePr();closeAll();}});

/* YEAR END */
function renderYE(cid){if(YE_DONE[cid])return;YE_DONE[cid]=true;var el=document.getElementById(cid);el.innerHTML='<div class="yeb"><div class="yet">Annual Performance Report - FY 2024</div><div class="yeh">Fraud Detection: Year in Review</div><div class="ym"><div><div class="yv g">247</div><div class="yl">Correct Fraud Claims Detected</div></div><div><div class="yv a">Rs 18.4 Cr</div><div class="yl">Total Financial Loss Prevented</div></div><div><div class="yv" style="color:var(--accent)">94.2%</div><div class="yl">Detection Accuracy Rate</div></div><div><div class="yv">3,841</div><div class="yl">Total Claims Processed</div></div></div></div><div class="cr" style="margin-bottom:20px"><div class="cc"><div class="ct">Monthly Fraud Detections vs Claims</div><div class="cs">Confirmed fraud (green) vs flags (amber)</div><div style="position:relative;height:240px"><canvas id="ye_m_'+cid+'"></canvas></div></div><div class="cc"><div class="ct">Loss Prevented by Type</div><div class="cs">Rs Crores per insurance category</div><div style="position:relative;height:240px"><canvas id="ye_d_'+cid+'"></canvas></div></div></div><div class="cc" style="margin-bottom:20px"><div class="ct">Year-over-Year Performance</div><div class="cs">2022 to 2023 to 2024 fraud detection and loss prevention</div><div style="position:relative;height:200px"><canvas id="ye_y_'+cid+'"></canvas></div></div><div class="sg" style="margin-bottom:20px"><div class="sc tl"><div class="slb">Correct Detections</div><div class="sv" style="color:var(--teal)">247</div><div class="sch up">Up 31% vs 2023</div></div><div class="sc am"><div class="slb">Loss Prevented</div><div class="sv" style="color:var(--amber)">Rs 18.4Cr</div><div class="sch up">Up 23% vs 14.9Cr</div></div><div class="sc bl2"><div class="slb">False Positives</div><div class="sv" style="color:var(--accent)">15</div><div class="sch up">Down 40%</div></div><div class="sc rd"><div class="slb">Fraud Rate</div><div class="sv" style="color:var(--red)">6.4%</div><div class="sch" style="color:var(--muted)">Industry avg: 8.1%</div></div></div><div class="tc"><div class="th2"><div class="tt2">Top Fraud Categories 2024</div></div><table><thead><tr><th>Rank</th><th>Type</th><th>Cases</th><th>Loss Prevented</th><th>Avg Inflation</th><th>Detection Rate</th></tr></thead><tbody><tr><td style="color:var(--amber);font-weight:700;font-family:\'JetBrains Mono\',monospace">#1</td><td>Property</td><td>84</td><td>Rs 620 L</td><td>340%</td><td><span class="badge bt">96.2%</span></td></tr><tr><td style="color:var(--muted);font-weight:700;font-family:\'JetBrains Mono\',monospace">#2</td><td>Motor</td><td>71</td><td>Rs 280 L</td><td>180%</td><td><span class="badge bt">93.8%</span></td></tr><tr><td style="color:var(--muted);font-weight:700;font-family:\'JetBrains Mono\',monospace">#3</td><td>Health</td><td>62</td><td>Rs 445 L</td><td>220%</td><td><span class="badge ba">91.2%</span></td></tr><tr><td style="color:var(--muted);font-weight:700;font-family:\'JetBrains Mono\',monospace">#4</td><td>Life</td><td>18</td><td>Rs 290 L</td><td>510%</td><td><span class="badge ba">88.9%</span></td></tr></tbody></table></div>';setTimeout(function(){var mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],co={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8b90b0',font:{size:11},boxWidth:10}}},scales:{x:{grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0',font:{size:10}}},y:{grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0'}}}};new Chart(document.getElementById('ye_m_'+cid),{type:'bar',data:{labels:mo,datasets:[{label:'Fraud Confirmed',data:[14,18,19,24,21,22,26,23,18,20,22,20],backgroundColor:'rgba(0,212,170,0.7)',borderRadius:4},{label:'Suspicious Flagged',data:[22,28,30,36,31,35,38,34,28,30,33,28],backgroundColor:'rgba(255,181,71,0.4)',borderRadius:4}]},options:co});new Chart(document.getElementById('ye_d_'+cid),{type:'doughnut',data:{labels:['Property','Motor','Health','Life','Travel'],datasets:[{data:[620,280,445,290,9],backgroundColor:['#6378ff','#00d4aa','#ffb547','#ff5470','#8b5cf6'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#8b90b0',font:{size:11},boxWidth:10,padding:10}}},cutout:'65%'}});new Chart(document.getElementById('ye_y_'+cid),{type:'line',data:{labels:['2022','2023','2024'],datasets:[{label:'Fraud Detected',data:[142,189,247],borderColor:'#00d4aa',backgroundColor:'rgba(0,212,170,0.1)',fill:true,tension:0.4,pointBackgroundColor:'#00d4aa',pointRadius:5},{label:'Loss Prevented Cr',data:[10.2,14.9,18.4],borderColor:'#ffb547',backgroundColor:'rgba(255,181,71,0.1)',fill:true,tension:0.4,pointBackgroundColor:'#ffb547',pointRadius:5}]},options:co});},150);}

/* CHARTS */
function initCharts(){if(CHARTS_OK)return;CHARTS_OK=true;var mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],co={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8b90b0',font:{size:11},boxWidth:10}}},scales:{x:{grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0',font:{size:10}}},y:{grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0'}}}},cn={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0',font:{size:10}}},y:{grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0'}}}};var e;e=document.getElementById('agMC');if(e)new Chart(e,{type:'bar',data:{labels:mo,datasets:[{label:'Claims Filed',data:[8,11,12,14,13,15,16,14,11,13,14,11],backgroundColor:'rgba(99,120,255,0.6)',borderRadius:4}]},options:cn});e=document.getElementById('agD');if(e)new Chart(e,{type:'doughnut',data:{labels:['Approved','Under Review','Flagged','Submitted'],datasets:[{data:[98,28,16,0],backgroundColor:['#00d4aa','#ffb547','#ff5470','#6378ff'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#8b90b0',font:{size:11},boxWidth:10,padding:9}}},cutout:'65%'}});e=document.getElementById('invMC');if(e)new Chart(e,{type:'bar',data:{labels:mo,datasets:[{label:'Flagged',data:[14,18,19,24,21,22,26,23,18,20,22,20],backgroundColor:'rgba(255,84,112,0.65)',borderRadius:4},{label:'Cleared',data:[22,28,30,36,31,35,38,34,28,30,33,28],backgroundColor:'rgba(0,212,170,0.55)',borderRadius:4}]},options:co});e=document.getElementById('invD');if(e)new Chart(e,{type:'doughnut',data:{labels:['Property','Motor','Health','Life','Travel'],datasets:[{data:[84,71,62,18,12],backgroundColor:['#6378ff','#00d4aa','#ffb547','#ff5470','#8b5cf6'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#8b90b0',font:{size:11},boxWidth:10,padding:9}}},cutout:'65%'}});e=document.getElementById('heatmap');if(e)new Chart(e,{type:'bar',data:{labels:mo,datasets:[{label:'Property',data:[6,7,8,9,8,9,10,8,7,8,7,7],backgroundColor:'#6378ff'},{label:'Motor',data:[4,6,6,7,6,7,8,6,5,6,7,5],backgroundColor:'#00d4aa'},{label:'Health',data:[3,4,4,6,5,5,6,7,5,6,7,4],backgroundColor:'#ffb547'},{label:'Life',data:[1,1,1,2,2,1,2,2,1,2,1,2],backgroundColor:'#ff5470'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8b90b0',font:{size:11},boxWidth:10}}},scales:{x:{stacked:true,grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0',font:{size:10}}},y:{stacked:true,grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0'}}}}});e=document.getElementById('admMC');if(e)new Chart(e,{type:'bar',data:{labels:mo,datasets:[{label:'Total Claims',data:[280,310,340,380,360,370,400,380,320,350,380,371],backgroundColor:'rgba(99,120,255,0.4)',borderRadius:4},{label:'Fraud Detected',data:[14,18,19,24,21,22,26,23,18,20,22,20],backgroundColor:'rgba(0,212,170,0.7)',borderRadius:4}]},options:co});e=document.getElementById('admBC');if(e)new Chart(e,{type:'bar',data:{labels:['Property','Health','Life','Motor','Travel'],datasets:[{label:'Loss Prevented',data:[620,445,290,280,9],backgroundColor:['#6378ff','#00d4aa','#ff5470','#ffb547','#8b5cf6'],borderRadius:6}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0'}},y:{grid:{color:'rgba(99,120,255,0.06)'},ticks:{color:'#8b90b0'}}}}});}

/* CHATBOT */
var BSYS={agent:'You are FraudShield AI for INSURANCE AGENT. Agents can ONLY submit new claims (3 steps: Policy Info, Incident Details, Documents). They CANNOT review, approve, or reject. After submission, claims go to Fraud Investigator for review, then Admin for final decision. Help with: claim submission steps, live risk scores, required documents, tracking claim status. Keep replies under 120 words.',investigator:'You are FraudShield AI for FRAUD INVESTIGATOR. Investigators review claims from agents and can: Clear (low risk), Flag Suspicious (medium risk), or Mark as Fraud (high risk). They CANNOT approve or reject - that is Admin only. After investigator action, claims go to Admin for final decision. Help with: review workflow, fraud detection, risk scoring, flagging decisions. Keep replies under 120 words.',admin:'You are FraudShield AI for ADMIN. Admins have final authority to Approve or Reject claims after investigator review. They also manage users. The workflow is: Agent submits -> Investigator reviews/flags -> Admin approves/rejects. Stats 2024: 3841 claims, 247 fraud (6.4%), Rs18.4Cr prevented, 94.2% accuracy. Keep replies under 120 words.'};
var BCHIPS={agent:['How do I submit a claim?','What happens after I submit?','Why was my claim flagged?','What docs do I need?'],investigator:['How do I review a claim?','What does Clear vs Flag mean?','How is risk score calculated?','When should I mark as fraud?'],admin:['How does the workflow work?','Approve vs reject difference?','How many claims need decision?','2024 fraud summary']};
function togChat(){CHAT_OPEN=!CHAT_OPEN;document.getElementById('chatWin').classList.toggle('op',CHAT_OPEN);if(CHAT_OPEN&&CHAT_HIST.length===0)initBot();}
function initBot(){var g={agent:'Hi! I am FraudShield AI. As an Insurance Agent, your job is to submit claims. After you submit, the claim goes to a Fraud Investigator for review, then Admin for final approval or rejection. How can I help?',investigator:'Hello Investigator! Your role is to review claims submitted by agents and decide: Clear (pass to Admin for approval), Flag Suspicious, or Mark as Fraud. Admin makes the final approval/rejection. What would you like help with?',admin:'Hello Admin! You have the final authority in the claim pipeline. Agents submit, Investigators review and flag, then you Approve or Reject. You currently have 12 claims awaiting your decision. How can I help?'};addBot(g[ROLE]||g.admin);showC();}
function showC(){var c=BCHIPS[ROLE]||BCHIPS.admin;document.getElementById('chips').innerHTML=c.map(function(x){return '<button class="chip" onclick="useC(this)">'+x+'</button>';}).join('');}
function useC(btn){var t=btn.textContent;document.getElementById('chips').innerHTML='';sendC(t);}
function ntime(){var d=new Date();return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function addBot(txt){var b=document.getElementById('msgs'),d=document.createElement('div');d.className='cm bot';d.innerHTML='<div class="cb">'+txt+'</div><div class="ctime">'+ntime()+'</div>';b.appendChild(d);b.scrollTop=b.scrollHeight;CHAT_HIST.push({role:'assistant',content:txt});}
function addUsr(txt){var b=document.getElementById('msgs'),d=document.createElement('div');d.className='cm usr';d.innerHTML='<div class="cb">'+txt.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div><div class="ctime">'+ntime()+'</div>';b.appendChild(d);b.scrollTop=b.scrollHeight;CHAT_HIST.push({role:'user',content:txt});}
function showTyp(){var b=document.getElementById('msgs'),d=document.createElement('div');d.className='cm bot';d.id='typEl';d.innerHTML='<div class="tdots"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>';b.appendChild(d);b.scrollTop=b.scrollHeight;}
function hideTyp(){var e=document.getElementById('typEl');if(e)e.remove();}
function fallC(txt){var t=txt.toLowerCase();if(t.indexOf('submit')>=0||t.indexOf('how')>=0)return {agent:'To submit a claim: click Submit Claim in the nav. Step 1: enter policy number, claim type, claimant name. Step 2: incident date, amount, description - risk score updates live. Step 3: select document type and submit. The claim then goes to a Fraud Investigator.',investigator:'To review a claim: go to Review Claims tab. Each claim shows risk score, claimant details, and detected flags. You have 3 choices: Clear it (pass to Admin for approval), Flag Suspicious (Admin reviews carefully), or Mark as Fraud (Admin will likely reject).',admin:'Current workflow: Agent submits a claim, Fraud Investigator reviews and flags it, then you make the final decision in Approve/Reject tab. You can Approve (claim paid out), Reject (claim denied), or Return for Re-investigation.'}[ROLE]||'Ask me about claim submission, review, or approval workflow.';if(t.indexOf('workflow')>=0||t.indexOf('process')>=0)return 'The claim workflow is: (1) Insurance Agent submits claim. (2) Fraud Investigator reviews, calculates risk score, and either Clears, Flags Suspicious, or Marks as Fraud. (3) Admin makes the final Approve or Reject decision. Agents cannot approve. Investigators cannot approve. Only Admin can approve or reject.';if(t.indexOf('approve')>=0||t.indexOf('reject')>=0)return 'Only Admins can approve or reject claims. Investigators can only review and flag. After the investigator acts on a claim, it moves to the Admin for the final decision. Admins can also return claims for re-investigation.';if(t.indexOf('flag')>=0)return 'Investigators can flag claims 3 ways: Clear (risk score low, all looks good - send to Admin for approval), Flag Suspicious (medium risk - Admin should scrutinise), Mark as Fraud (high risk - recommend rejection). Agents can see their claim status as Flagged in My Claims.';if(t.indexOf('risk')>=0)return 'Risk scores (0-100) are calculated from: claim amount vs policy average, prior claims history, third-party involvement, and description keywords. Below 30 = Low (clear), 30-60 = Medium (flag), above 60 = High (fraud likely).';return 'I can explain the claim workflow, roles and permissions, risk scoring, or how to use specific features. What would you like to know?';}
function sendC(ov){if(CHAT_BUSY)return;var inp=document.getElementById('chatIn'),txt=ov||inp.value.trim();if(!txt)return;inp.value='';document.getElementById('chips').innerHTML='';addUsr(txt);CHAT_BUSY=true;document.getElementById('chatBtn').disabled=true;showTyp();var hist=CHAT_HIST.slice(Math.max(0,CHAT_HIST.length-10));fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:250,system:BSYS[ROLE]||BSYS.admin,messages:hist})}).then(function(r){return r.json();}).then(function(data){hideTyp();CHAT_BUSY=false;document.getElementById('chatBtn').disabled=false;var reply=(data.content&&data.content[0]&&data.content[0].text)?data.content[0].text:fallC(txt);addBot(reply);showC();}).catch(function(){hideTyp();CHAT_BUSY=false;document.getElementById('chatBtn').disabled=false;addBot(fallC(txt));showC();});}


/* CASE DETAIL */
var CASE_DATA = {
  'INV-438': {cid:'CLM-8820',type:'Motor Insurance',amount:'Rs 3,20,000',agent:'Rakesh Verma',date:'15 Jan 2024',notes:'Vehicle damage claim submitted. Damage photos show inconsistencies with reported collision. Workshop estimate appears inflated. Spoke with third party - accounts differ significantly.',timeline:[{s:'done',label:'Claim submitted by agent',time:'15 Jan 2024, 10:22 AM'},{s:'done',label:'Auto risk scoring completed (91/100)',time:'15 Jan 2024, 10:23 AM'},{s:'active',label:'Investigation in progress',time:'16 Jan 2024, 09:15 AM'},{s:'pending',label:'Awaiting admin decision',time:'Pending'}]},
  'INV-441': {cid:'CLM-8847',type:'Property Insurance',amount:'Rs 9,50,000',agent:'Rahul Mehta',date:'22 Jan 2024',notes:'Property damage claim for commercial premises. Valuation report obtained from claimant significantly exceeds independent assessor estimate. Prior claim for same property 6 months ago.',timeline:[{s:'done',label:'Claim submitted by agent',time:'22 Jan 2024, 2:14 PM'},{s:'done',label:'Auto risk scoring completed (87/100)',time:'22 Jan 2024, 2:15 PM'},{s:'done',label:'Field visit conducted',time:'24 Jan 2024, 11:00 AM'},{s:'active',label:'Investigation ongoing - report pending',time:'28 Jan 2024, 3:00 PM'},{s:'pending',label:'Awaiting admin decision',time:'Pending'}]},
  'INV-435': {cid:'CLM-8799',type:'Health Insurance',amount:'Rs 1,80,000',agent:'Kavita Joshi',date:'10 Jan 2024',notes:'Hospital bills submitted for surgery. Discharge summary date does not match billing date. Hospital confirmed patient was admitted but billing records show different department.',timeline:[{s:'done',label:'Claim submitted by agent',time:'10 Jan 2024, 9:45 AM'},{s:'done',label:'Auto risk scoring completed (62/100)',time:'10 Jan 2024, 9:46 AM'},{s:'active',label:'Document verification in progress',time:'12 Jan 2024, 2:30 PM'},{s:'pending',label:'Awaiting admin decision',time:'Pending'}]},
  'INV-430': {cid:'CLM-8784',type:'Motor Insurance',amount:'Rs 45,000',agent:'Amit Verma',date:'5 Jan 2024',notes:'Minor motor claim. Date on FIR is one day after reported incident date. Claimant says it was a clerical error at police station. Amount is within normal range.',timeline:[{s:'done',label:'Claim submitted by agent',time:'5 Jan 2024, 4:00 PM'},{s:'done',label:'Auto risk scoring completed (38/100)',time:'5 Jan 2024, 4:01 PM'},{s:'active',label:'Date discrepancy being verified',time:'7 Jan 2024, 10:00 AM'},{s:'pending',label:'Awaiting admin decision',time:'Pending'}]}
};

function openCase(invId, clmId, type, amount, score, flags, priority) {
  var data = CASE_DATA[invId] || {cid:clmId, type:type, amount:amount, agent:'Unknown', date:'Unknown', notes:flags, timeline:[{s:'active',label:'Investigation in progress',time:'Today'}]};
  var scoreColor = score >= 70 ? 'var(--red)' : score >= 40 ? 'var(--amber)' : 'var(--teal)';
  var riskLabel = score >= 70 ? 'High Risk - Investigation Required' : score >= 40 ? 'Medium Risk - Review Carefully' : 'Low Risk - Likely Legitimate';
  document.getElementById('caseModTitle').textContent = invId;
  document.getElementById('caseModSub').textContent = 'Claim ' + data.cid + ' - ' + data.type;
  document.getElementById('caseScore').textContent = score;
  document.getElementById('caseScore').style.color = scoreColor;
  document.getElementById('caseRiskLabel').textContent = riskLabel;
  document.getElementById('caseRiskLabel').style.color = scoreColor;
  document.getElementById('casePriority').textContent = 'Priority: ' + priority;
  document.getElementById('caseNotes').textContent = data.notes;
  setTimeout(function(){ document.getElementById('caseScoreBar').style.width = score + '%'; document.getElementById('caseScoreBar').style.background = scoreColor; }, 100);
  document.getElementById('caseStats').innerHTML =
    '<div class="case-stat"><label>Claim ID</label><div class="val mono">' + data.cid + '</div></div>' +
    '<div class="case-stat"><label>Amount</label><div class="val">' + data.amount + '</div></div>' +
    '<div class="case-stat"><label>Type</label><div class="val">' + data.type + '</div></div>' +
    '<div class="case-stat"><label>Filed By</label><div class="val">' + data.agent + '</div></div>' +
    '<div class="case-stat"><label>Filed On</label><div class="val">' + data.date + '</div></div>' +
    '<div class="case-stat"><label>Risk Flag</label><div class="val" style="font-size:11.5px;color:var(--red)">' + flags + '</div></div>';
  document.getElementById('caseTL').innerHTML = data.timeline.map(function(t, i) {
    var isLast = i === data.timeline.length - 1;
    return '<div class="tl-item"><div><div class="tl-dot ' + t.s + '"></div>' + (!isLast ? '<div class="tl-line" style="height:28px;margin-left:4px;margin-top:2px;width:2px;background:var(--border)"></div>' : '') + '</div><div class="tl-content"><div class="tl-label">' + t.label + '</div><div class="tl-time">' + t.time + '</div></div></div>';
  }).join('');
  openModal('caseMod');
}

function saveCaseNote() {
  var note = document.getElementById('caseNoteInput').value.trim();
  if (!note) { showToast('Please enter a note first'); return; }
  document.getElementById('caseNoteInput').value = '';
  document.getElementById('caseNotes').textContent = note;
  showToast('Investigation note saved successfully');
}

function escalateCase() {
  closeModal('caseMod');
  showToast('Case escalated to Admin - they will be notified');
}

/* EDIT USER */
function editUser(name, empId, role, status) {
  document.getElementById('euAvatar').textContent = name.split(' ').map(function(n){return n[0];}).join('').slice(0,2).toUpperCase();
  document.getElementById('euName').textContent = name;
  document.getElementById('euEmpId').textContent = empId;
  document.getElementById('euNameInput').value = name;
  document.getElementById('euRole').value = role;
  document.getElementById('euStatus').value = status;
  openModal('editUserMod');
}

function saveUser() {
  var name = document.getElementById('euNameInput').value.trim();
  if (!name) { showToast('Name cannot be empty'); return; }
  closeModal('editUserMod');
  showToast('User ' + name + ' updated successfully');
}

function deleteUser() {
  var name = document.getElementById('euName').textContent;
  if (!confirm('Deactivate ' + name + '? They will lose system access.')) return;
  closeModal('editUserMod');
  showToast(name + ' account deactivated');
}

/* ADD USER */
function openAddUser() { openModal('addUserMod'); }

function toggleAuRole() {
  var t = document.getElementById('auType').value;
  document.getElementById('auRoleWrap').style.display = t === 'user' ? 'block' : 'none';
}

function createUser() {
  var f = document.getElementById('auFirst').value.trim();
  var l = document.getElementById('auLast').value.trim();
  var e = document.getElementById('auEmail').value.trim();
  var id = document.getElementById('auEmpId').value.trim();
  var p = document.getElementById('auPass').value;
  var p2 = document.getElementById('auPass2').value;
  if (!f || !l || !e || !id || !p) { showToast('Please fill all required fields'); return; }
  if (p !== p2) { showToast('Passwords do not match'); return; }
  var name = f + ' ' + l;
  var roleType = document.getElementById('auType').value;
  var roleLbl = roleType === 'admin' ? 'Administrator' : (document.getElementById('auRole').value === 'investigator' ? 'Fraud Investigator' : 'Insurance Agent');
  // Add to table
  var tbody = document.querySelector('#admUsers tbody');
  if (tbody) {
    var newRow = document.createElement('tr');
    newRow.style.animation = 'slideUp .4s ease';
    var badgeType = roleType === 'admin' ? '<span class="badge br">Admin</span>' : '<span class="badge bb">User</span>';
    var permBadge = roleType === 'admin' ? '<span class="badge bt">Full Access + Approve/Reject</span>' : (document.getElementById('auRole').value === 'investigator' ? '<span class="badge ba" style="background:rgba(255,181,71,0.15);color:var(--amber)">Can Review &amp; Flag</span>' : '<span class="badge ba">Can Submit Claims</span>');
    var finalRole = roleType === 'admin' ? 'admin' : document.getElementById('auRole').value;
    newRow.innerHTML = '<td>' + name + '</td><td>' + badgeType + '</td><td>' + permBadge + '</td><td class="mono">' + id + '</td><td>0</td><td>Just now</td><td><span class="badge bt">Active</span></td><td><button class="bsm">Edit</button></td>';
    newRow.querySelector('button').onclick = function(){ editUser(name, id, finalRole, 'Active'); };
    tbody.insertBefore(newRow, tbody.firstChild);
  }
  ['auFirst','auLast','auEmail','auEmpId','auPass','auPass2'].forEach(function(id){document.getElementById(id).value='';});
  closeModal('addUserMod');
  showToast('User ' + name + ' created successfully - credentials sent by email');
}

/* SEARCH HISTORY */
var HISTORY_DATA = {
  'POL-2291847': {name:'Vikram Singh', claims:[
    {id:'CLM-8847',type:'Property',amount:'Rs 9,50,000',date:'22 Jan 2024',status:'Flagged',risk:87},
    {id:'CLM-7901',type:'Property',amount:'Rs 4,20,000',date:'8 Jul 2023',status:'Approved',risk:32},
    {id:'CLM-7234',type:'Motor',amount:'Rs 95,000',date:'12 Jan 2023',status:'Approved',risk:18}
  ]},
  'POL-1183920': {name:'Priya Sharma', claims:[
    {id:'CLM-8839',type:'Health',amount:'Rs 2,80,500',date:'18 Jan 2024',status:'Under Review',risk:54},
    {id:'CLM-7788',type:'Health',amount:'Rs 1,20,000',date:'3 Mar 2023',status:'Approved',risk:22}
  ]},
  'POL-9920031': {name:'Suresh Nair', claims:[
    {id:'CLM-8861',type:'Life',amount:'Rs 14,20,000',date:'28 Jan 2024',status:'Submitted',risk:18}
  ]}
};

function searchHistory() {
  var polInput = document.querySelector('#iAnalysis input[placeholder="POL-XXXXXXXX"]');
  var pol = polInput ? polInput.value.trim() : '';
  var data = pol ? HISTORY_DATA[pol] : null;
  var sub, body;
  if (!pol) {
    sub = 'Enter a policy number and search';
    body = '<div style="text-align:center;padding:30px;color:var(--muted)">Please enter a policy number in the field above and try again.</div>';
  } else if (!data) {
    sub = 'No records found for ' + pol;
    body = '<div class="alert ae">No claims found for policy number ' + pol + '. Please verify the number and try again.</div>';
  } else {
    sub = data.name + ' - ' + data.claims.length + ' claim(s) found';
    var rows = data.claims.map(function(c) {
      var sc = c.risk < 30 ? 'var(--teal)' : c.risk < 60 ? 'var(--amber)' : 'var(--red)';
      var sb = c.status === 'Approved' ? 'bt' : c.status === 'Flagged' ? 'br' : 'ba';
      return '<div class="history-row"><div><div style="font-size:13px;font-weight:600;font-family:\'JetBrains Mono\',monospace">' + c.id + '</div><div style="font-size:11px;color:var(--muted);margin-top:2px">' + c.type + ' &bull; ' + c.date + '</div></div><div style="text-align:right"><div style="font-size:13px;font-weight:600">' + c.amount + '</div><div style="display:flex;gap:6px;justify-content:flex-end;margin-top:4px"><span class="badge ' + sb + '">' + c.status + '</span><span style="font-size:11px;color:' + sc + ';font-family:\'JetBrains Mono\',monospace">' + c.risk + '/100</span></div></div></div>';
    }).join('');
    var totalAmt = data.claims.reduce(function(s,c){return s+(parseInt(c.amount.replace(/[^0-9]/g,''))||0);},0);
    body = '<div style="background:var(--surface2);border-radius:10px;padding:12px 15px;margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap"><div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Policyholder</div><div style="font-size:14px;font-weight:700">' + data.name + '</div></div><div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Total Claims</div><div style="font-size:14px;font-weight:700">' + data.claims.length + '</div></div><div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Total Amount</div><div style="font-size:14px;font-weight:700">Rs ' + totalAmt.toLocaleString() + '</div></div></div>' + rows;
  }
  document.getElementById('histModSub').textContent = sub;
  document.getElementById('histModBody').innerHTML = body;
  openModal('historyMod');
}
/* Also close modals on overlay click */
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('op');
  }
});

/*    CLAIM ROW CLICK   DETAIL MODAL    */
function populatePanelsFromQueue(){
  /* Investigator: populate reviewCardsBox from PENDING_REVIEW */
  var rBox=document.getElementById('reviewCardsBox');
  if(rBox && ROLE==='investigator'){
    /* Remove dynamically added cards from prev session (keep static HTML ones) */
    var dynamic=rBox.querySelectorAll('[data-dynamic]');
    dynamic.forEach(function(el){el.remove();});
    if(PENDING_REVIEW.length>0){
      var msg=document.getElementById('allReviewedMsg');
      if(msg) msg.classList.add('hidden');
      /* Prepend each pending claim as a fresh card */
      PENDING_REVIEW.forEach(function(claim){
        if(document.getElementById('rc_'+claim.cardId)) return; /* already in DOM */
        var newCard=document.createElement('div');
        newCard.setAttribute('data-dynamic','1');
        newCard.className='review-card '+claim.riskClass;
        newCard.id='rc_'+claim.cardId;
        newCard.style.animation='slideUp .4s ease';
        newCard.innerHTML=
          '<div class="rc-top">'+
            '<div><div class="rc-id">'+claim.cid+'</div>'+
            '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">Submitted by '+claim.agentName+' &bull; '+claim.ds+'</div></div>'+
            '<div style="text-align:right">'+
              '<div style="font-size:28px;font-weight:700;font-family:\'JetBrains Mono\',monospace;'+claim.riskStyle+'">'+claim.sc+'<span style="font-size:14px">/100</span></div>'+
              '<div style="font-size:10.5px;'+claim.riskStyle+'">'+claim.riskLabel+'</div>'+
            '</div>'+
          '</div>'+
          '<div class="rc-body">'+
            '<div class="rc-field"><label>Claim Type</label><div class="val">'+claim.ty+' Insurance</div></div>'+
            '<div class="rc-field"><label>Claim Amount</label><div class="val">Rs '+claim.am+'</div></div>'+
            '<div class="rc-field"><label>Incident Location</label><div class="val">'+claim.loc+'</div></div>'+
            '<div class="rc-field"><label>Claimant</label><div class="val">'+claim.nm+'</div></div>'+
            '<div class="rc-field"><label>Policy No.</label><div class="val mono">'+claim.pol+'</div></div>'+
            '<div class="rc-field"><label>Prior Claims</label><div class="val" style="'+(claim.prevC>=2?'color:var(--red)':claim.prevC===1?'color:var(--amber)':'color:var(--teal)')+'">'+
              (claim.prevC===0?'None':claim.prevC+' in last 12 months')+'</div></div>'+
          '</div>'+
          '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;background:var(--surface2);border-radius:8px;padding:9px 12px">'+
            '<span style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;font-weight:600;display:block;margin-bottom:4px">Description</span>'+
            claim.desc+(claim.desc.length>=120?'...':'')+
          '</div>'+
          '<div class="rc-flags"><div class="rc-flag-title">Detected Risk Factors</div>'+claim.flagsHtml+'</div>'+
          '<div class="rc-actions">'+
            '<button class="bgreen" data-card="'+claim.cardId+'" data-cid="'+claim.cid+'" data-act="cleared">&#10004; Clear (Low Risk)</button>'+
            '<button class="bamb" data-card="'+claim.cardId+'" data-cid="'+claim.cid+'" data-act="flagged">&#9888; Flag Suspicious</button>'+
            '<button class="bred" data-card="'+claim.cardId+'" data-cid="'+claim.cid+'" data-act="fraud">&#10006; Mark as Fraud</button>'+
          '</div>';
        newCard.querySelectorAll('[data-act]').forEach(function(btn){
          btn.onclick=function(){takeAction(btn.dataset.card,btn.dataset.act,btn.dataset.cid);};
        });
        rBox.insertBefore(newCard, rBox.firstChild);
      });
      /* Update investigator dashboard counter */
      var invStat=document.querySelector('#iDash .sc.am .sv');
      if(invStat) invStat.textContent=18+PENDING_REVIEW.length;
    }
  }

  /* Admin: populate approveCardsBox from PENDING_APPROVAL */
  var aBox=document.getElementById('approveCardsBox');
  if(aBox && ROLE==='admin'){
    var dynamic2=aBox.querySelectorAll('[data-dynamic]');
    dynamic2.forEach(function(el){el.remove();});
    PENDING_APPROVAL.forEach(function(item){
      if(document.getElementById('ac_'+item.cardId)) return;
      var borderCls=item.action==='fraud'?'urgent':item.action==='flagged'?'medium':'';
      var actionLabel=item.action==='fraud'?'MARKED AS FRAUD - FLAGGED':item.action==='flagged'?'FLAGGED SUSPICIOUS':'CLEARED BY INVESTIGATOR';
      var newACard=document.createElement('div');
      newACard.setAttribute('data-dynamic','1');
      newACard.className='review-card '+borderCls;
      newACard.id='ac_'+item.cardId;
      newACard.style.animation='slideUp .4s ease';
      newACard.innerHTML=
        '<div class="rc-top">'+
          '<div>'+
            '<div class="rc-id">'+item.claimId+' <span class="badge '+item.badge+'" style="font-size:10px;vertical-align:middle">'+actionLabel+'</span></div>'+
            '<div style="font-size:11.5px;color:var(--muted);margin-top:3px">Reviewed by Investigator: '+item.investigator+'</div>'+
          '</div>'+
        '</div>'+
        '<div class="rc-flags" style="margin-bottom:14px"><div class="rc-flag-title">Investigator Findings</div>'+
          '<div class="rc-flag'+(item.action==='fraud'?' d':'')+'">'+item.invNote+'</div>'+
        '</div>'+
        '<div class="rc-actions">'+
          '<button class="bgreen" data-card="'+item.cardId+'" data-cid="'+item.claimId+'" data-act="approved">&#10004; Approve Claim</button>'+
          '<button class="bred" data-card="'+item.cardId+'" data-cid="'+item.claimId+'" data-act="rejected">&#10006; Reject Claim</button>'+
          '<button class="bamb" data-card="'+item.cardId+'" data-cid="'+item.claimId+'" data-act="reinvestigate">&#8635; Return for Re-investigation</button>'+
        '</div>';
      newACard.querySelectorAll('[data-act]').forEach(function(btn){
        btn.onclick=function(){admDecision(btn.dataset.card,btn.dataset.act,btn.dataset.cid);};
      });
      aBox.insertBefore(newACard, aBox.firstChild);
    });
    /* Update admin pending count */
    var pc=document.getElementById('pendingCount');
    if(pc) pc.textContent=12+PENDING_APPROVAL.length;
  }
}

function initClaimRowClicks(){
  document.querySelectorAll('#agRecent tr, #myCB tr').forEach(function(row){
    if(!row.dataset.bound){
      row.dataset.bound='1';
      row.style.cursor='pointer';
      row.addEventListener('click',function(){
        var cells=row.querySelectorAll('td');
        if(cells.length<4) return;
        var claimId=(cells[0]||{}).textContent||'';
        var type=(cells[1]||cells[2]||{}).textContent||'';
        var amount=(cells[2]||cells[3]||{}).textContent||'';
        var status=(cells[4]||cells[5]||cells[6]||{}).textContent||'';
        openClaimDetail(claimId, type, amount, status, row);
      });
    }
  });
}

var CLAIM_DETAILS={
  'CLM-8821':{type:'Motor Insurance',amount:'Rs 1,24,000',claimant:'Rahul Mehta',date:'12 Jan 2024',policy:'POL-7821001',location:'Mumbai, MH',desc:'Rear-end collision at signal junction. Damage to rear bumper and boot area.',docs:'FIR Report, Workshop Estimate',status:'Approved',stage:'Admin Approved',risk:12,investigator:'Sanjay Kumar',adminNote:'All documents verified. Approved for payout.'},
  'CLM-8839':{type:'Health Insurance',amount:'Rs 2,80,500',claimant:'Priya Sharma',date:'18 Jan 2024',policy:'POL-1183920',location:'Pune, MH',desc:'Hospitalisation for appendectomy surgery. 4-day stay at City Hospital.',docs:'Hospital Bills, Discharge Summary',status:'Under Review',stage:'Investigator Reviewing',risk:54,investigator:'Divya Patel',adminNote:''},
  'CLM-8847':{type:'Property Insurance',amount:'Rs 9,50,000',claimant:'Vikram Singh',date:'22 Jan 2024',policy:'POL-2291847',location:'Mumbai, MH',desc:'Commercial property fire damage. Roof and interior extensively damaged.',docs:'Fire Report, Property Valuation',status:'Flagged',stage:'Flagged by Investigator',risk:87,investigator:'Divya Patel',adminNote:''},
  'CLM-8854':{type:'Motor Insurance',amount:'Rs 68,000',claimant:'Anita Verma',date:'25 Jan 2024',policy:'POL-5540021',location:'Delhi, DL',desc:'Side collision in parking lot. Left door panel and mirror damaged.',docs:'FIR Report, Repair Bill',status:'Approved',stage:'Admin Approved',risk:8,investigator:'Sanjay Kumar',adminNote:'Low risk, swift approval.'},
  'CLM-8878':{type:'Health Insurance',amount:'Rs 3,10,000',claimant:'Kavita Joshi',date:'2 Feb 2024',policy:'POL-9910034',location:'Pune, MH',desc:'Knee replacement surgery. 6-day hospitalisation.',docs:'Hospital Records, Bills',status:'Approved',stage:'Admin Approved',risk:22,investigator:'Divya Patel',adminNote:'Documents verified. Approved.'},
  'CLM-8899':{type:'Property Insurance',amount:'Rs 18,75,000',claimant:'Amit Kumar',date:'8 Feb 2024',policy:'POL-3348801',location:'Mumbai, MH',desc:'Warehouse flood damage claim.',docs:'Flood Report, Valuation',status:'Rejected',stage:'Admin Rejected',risk:91,investigator:'Divya Patel',adminNote:'Rejected - fraudulent valuation confirmed.'}
};

function openClaimDetail(claimId, fallbackType, fallbackAmt, fallbackStatus, row){
  var d=CLAIM_DETAILS[claimId.trim()]||{type:fallbackType,amount:fallbackAmt,claimant:'Unknown',date:'Unknown',policy:'-',location:'-',desc:'No details available.',docs:'-',status:fallbackStatus,stage:'-',risk:0,investigator:'-',adminNote:''};
  var sc=d.risk; var scoreColor=sc>=70?'var(--red)':sc>=40?'var(--amber)':'var(--teal)';
  var stBadge=d.status==='Approved'?'bt':d.status==='Rejected'?'br':d.status==='Flagged'?'br':'ba';
  var existing=document.getElementById('claimDetailMod');
  if(existing) existing.remove();
  var mod=document.createElement('div');
  mod.id='claimDetailMod';
  mod.className='modal-overlay op';
  mod.style.zIndex='850';
  mod.innerHTML=
    '<div class="modal-box" style="max-width:580px">'+
      '<div class="modal-head">'+
        '<div>'+
          '<div class="modal-title" style="font-family:\'JetBrains Mono\',monospace">'+claimId+'</div>'+
          '<div style="margin-top:3px"><span class="badge '+stBadge+'" style="font-size:11px">'+d.status+'</span></div>'+
        '</div>'+
        '<button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">&#10005;</button>'+
      '</div>'+
      '<div class="modal-body">'+
        /* Risk Banner */
        '<div style="display:flex;align-items:center;gap:14px;background:var(--surface2);border-radius:11px;padding:14px 16px;margin-bottom:16px">'+
          '<div style="text-align:center;min-width:64px">'+
            '<div style="font-size:34px;font-weight:700;font-family:\'JetBrains Mono\',monospace;color:'+scoreColor+'">'+sc+'</div>'+
            '<div style="font-size:10px;color:var(--muted);margin-top:1px">RISK SCORE</div>'+
          '</div>'+
          '<div style="flex:1">'+
            '<div style="height:7px;background:var(--surface3);border-radius:4px;overflow:hidden;margin-bottom:7px">'+
              '<div style="height:100%;width:'+sc+'%;background:'+scoreColor+';border-radius:4px;transition:width 1s ease"></div>'+
            '</div>'+
            '<div style="font-size:12px;font-weight:600;color:'+scoreColor+'">'+(sc<30?'Low Risk':sc<60?'Medium Risk':'High Risk')+'</div>'+
            '<div style="font-size:11px;color:var(--muted);margin-top:2px">Pipeline Stage: '+d.stage+'</div>'+
          '</div>'+
        '</div>'+
        /* Details grid */
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'+
          '<div style="background:var(--surface2);border-radius:9px;padding:11px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Claimant</div><div style="font-size:13px;font-weight:600">'+d.claimant+'</div></div>'+
          '<div style="background:var(--surface2);border-radius:9px;padding:11px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Claim Type</div><div style="font-size:13px;font-weight:600">'+d.type+'</div></div>'+
          '<div style="background:var(--surface2);border-radius:9px;padding:11px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Claim Amount</div><div style="font-size:13px;font-weight:700;color:var(--text)">'+d.amount+'</div></div>'+
          '<div style="background:var(--surface2);border-radius:9px;padding:11px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Policy Number</div><div style="font-size:12px;font-family:\'JetBrains Mono\',monospace">'+d.policy+'</div></div>'+
          '<div style="background:var(--surface2);border-radius:9px;padding:11px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Filed On</div><div style="font-size:13px">'+d.date+'</div></div>'+
          '<div style="background:var(--surface2);border-radius:9px;padding:11px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Location</div><div style="font-size:13px">'+d.location+'</div></div>'+
        '</div>'+
        /* Description */
        '<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-weight:600">Incident Description</div><div style="background:var(--surface2);border-radius:9px;padding:11px 13px;font-size:12.5px;line-height:1.55;color:var(--text)">'+d.desc+'</div></div>'+
        /* Documents */
        '<div style="margin-bottom:12px"><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-weight:600">Supporting Documents</div><div style="background:var(--surface2);border-radius:9px;padding:11px 13px;font-size:12.5px;color:var(--text)">'+d.docs+'</div></div>'+
        /* Investigator */
        '<div style="display:flex;gap:10px;flex-wrap:wrap">'+
          '<div style="flex:1;min-width:160px;background:var(--surface2);border-radius:9px;padding:11px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Reviewed By</div><div style="font-size:13px;font-weight:600">'+d.investigator+'</div></div>'+
          (d.adminNote?'<div style="flex:2;min-width:200px;background:var(--surface2);border-radius:9px;padding:11px"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Admin Note</div><div style="font-size:12.5px">'+d.adminNote+'</div></div>':'')+
        '</div>'+
      '</div>'+
      '<div class="modal-foot">'+
        '<button class="bsm" onclick="this.closest(\'.modal-overlay\').remove()">Close</button>'+
        '<button class="bico" onclick="doExport()">&#128229; Export</button>'+
      '</div>'+
    '</div>';
  mod.addEventListener('click',function(e){if(e.target===mod) mod.remove();});
  document.body.appendChild(mod);
}

/*    LIVE NOTIFICATION COUNT    */
var NOTIF_COUNT=3;
function addNotif(msg){
  NOTIF_COUNT++;
  document.getElementById('nd').style.display='block';
  var panel=document.getElementById('notifPanel');
  var head=panel.querySelector('.np-head');
  var item=document.createElement('div');
  item.className='nitem unread';
  item.innerHTML='<div class="ntitle">'+msg+'</div><div class="ntime">Just now</div>';
  head.after(item);
}

/*    DASHBOARD STATS LIVE UPDATE    */
function updateAgentStats(){
  var rows=document.querySelectorAll('#myCB tr');
  var total=rows.length, approved=0, reviewing=0, flagged=0;
  rows.forEach(function(r){
    var s=r.dataset.status||'';
    if(s==='Approved') approved++;
    else if(s==='Under Review'||s==='Submitted') reviewing++;
    else if(s==='Flagged'||s==='Rejected') flagged++;
  });
  var tEl=document.getElementById('aStT'); if(tEl) tEl.textContent=total;
  var aEl=document.getElementById('aStA'); if(aEl) aEl.textContent=approved;
  var iEl=document.getElementById('aStI'); if(iEl) iEl.textContent=reviewing;
  var fEl=document.getElementById('aStF'); if(fEl) fEl.textContent=flagged;
  var cc=document.getElementById('myCC'); if(cc) cc.textContent=total;
}

/*    CLAIM STATUS PIPELINE TRACKER    */
var PIPELINE_STATUS={
  'Submitted':'Awaiting Investigator Review',
  'Under Review':'Investigator Reviewing',
  'Flagged':'Flagged by Investigator - Awaiting Admin',
  'Approved':'Admin Approved - Payment Processing',
  'Rejected':'Admin Rejected - Claim Denied'
};

function getPipelineLabel(status){
  return PIPELINE_STATUS[status]||status;
}

/*    HOOK: update stats after claim submit    */
var _origSubClaim = subClaim;
subClaim = function(){
  _origSubClaim.apply(this, arguments);
  setTimeout(function(){ updateAgentStats(); initClaimRowClicks(); }, 600);
};

/*    HOOK: update stats and notifs after investigator action    */
var _origTakeAction = takeAction;
takeAction = function(cardId, action, claimId){
  _origTakeAction.apply(this, arguments);
  var msg=action==='fraud'?claimId+' marked as fraud - sent to Admin for rejection':
           action==='flagged'?claimId+' flagged suspicious - Admin review required':
           claimId+' cleared - sent to Admin for approval';
  addNotif(msg);
};

/*    HOOK: notif after admin decision    */
var _origAdmDecision = admDecision;
admDecision = function(cardId, action, claimId){
  _origAdmDecision.apply(this, arguments);
  var msg=action==='approved'?claimId+' APPROVED - payment processing initiated':
           action==='rejected'?claimId+' REJECTED - claimant notified':
           claimId+' returned for re-investigation';
  addNotif(msg);
};

/*    INIT AFTER LAUNCH    */
var _origLaunch = launch;
launch = function(){
  _origLaunch.apply(this, arguments);
  setTimeout(function(){
    initClaimRowClicks();
  }, 200);
};

document.getElementById('lEmail').value='admin@company.com';
