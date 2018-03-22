////////////
//HTML Interaction
////////////
$('.slider').bind('input', function() {
	$(this).next().html(format($(this).val(), 2, 0));
});

$('.pSpecies').bind('input', function() {
	var p1Species = $('#p1Species').val();
	var p2Species = $('#p2Species').val();
	
	$('#childSpecies').val(getSpecies(p1Species, p2Species));
});

$('.updateAbility').change(updateAbility);
$('.updateNature').bind('input', updateNature);
$('.updateItem').bind('input', updateItem);
$('.updateIV').bind('input', updateIVs);

function updateAll()
{
	updateAbility();
	updateNature();
	updateIVs();
}

function updateItem()
{
	updateIVs();
	updateNature();
}

function updateIVs()
{
	var p1IVs = [];
	$('.p1IV').each(function() {p1IVs.push(parseInt($(this).val()));});
	var p2IVs = [];
	$('.p2IV').each(function() {p2IVs.push(parseInt($(this).val()));});
	
	var p1Item = parseInt($('#p1Item').val());
	var p2Item = parseInt($('#p2Item').val());
	
	var thresholds = [];
	$('.childIV').each(function() {thresholds.push(parseInt($(this).val()));});
	
	var ivOdds = calculateIVs({ivs:p1IVs, item:p1Item}, {ivs:p2IVs, item:p2Item}, thresholds);
	var childIVs = $('.childIV').next().next();
	for(var i = 0; i < NUM_STATS; ++i)
	{
		ivOdds[i] *= 100.;
		childIVs[i].innerHTML = format(ivOdds[i], 1, 4) + "%";
	}
	
	$('.ivOdds').html(format(ivOdds[NUM_STATS] * 100., 1, 4) + "%");
}

function updateAbility()
{
	var p1Species = $('#p1Species').val();
	var p2Species = $('#p2Species').val();
	
	var p1Gender = parseInt($('#p1Gender').val());
	var p2Gender = parseInt($('#p2Gender').val());
	
	var p1Slot = parseInt($('#p1Ability').val());
	var p2Slot = parseInt($('#p2Ability').val());
	var childSlot = parseInt($('#childAbility').val());
	
	var p1TwoSlots = $('#p1TwoSlots').is(":checked");
	var p2TwoSlots = $('#p2TwoSlots').is(":checked");
	
	var abilityOdds = calculateAbility(
		{species:p1Species, gender:p1Gender, ability:{slot:p1Slot, twoSlots:p1TwoSlots}},
		{species:p2Species, gender:p2Gender, ability:{slot:p2Slot, twoSlots:p2TwoSlots}},
		childSlot);
	abilityOdds *= 100.;
	
	$('#abilityOdds').html(format(abilityOdds, 1, 4) + "%");
}

function updateNature()
{
	var p1Nature = parseInt($('#p1Nature').val());
	var p2Nature = parseInt($('#p2Nature').val());
	var childNature = parseInt($('#childNature').val());
	
	var p1Item = parseInt($('#p1Item').val());
	var p2Item = parseInt($('#p2Item').val());
	
	var natureOdds = calculateNature({nature:p1Nature, item:p1Item}, {nature:p2Nature, item:p2Item}, childNature);
	natureOdds *= 100.;
	
	$('#natureOdds').html(format(natureOdds, 1, 4) + "%");
}


////////////
//CONSTANTS
////////////

//genders
const MALE = 0;
const FEMALE = 1;
const NONE = 2;

//stats
const INVALID = -1;
const HP = 0;
const ATK = 1;
const DEF = 2;
const SPE = 3;
const SPA = 4;
const SPD = 5;
const NUM_STATS = 6;

//items; 0-5 reserved for stat items
const NO_ITEM = -1;
const DESTINY_KNOT = 6;
const EVERSTONE = 7;

//natures
const DONT_CARE = -1;
const NUM_NATURES = 25;

//ivs
const NUM_IVS = 32;
const MAX_IV = NUM_IVS - 1;


////////////
//UTILITY
////////////
function myFunction() {
    document.getElementById("demo").innerHTML = "Paragraph changed.";
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function comb(arr)
{
	var sum = 0;
    var and = 1;
    for(var i = 0; i < NUM_STATS; ++i)
    {
    	sum += arr[i];
        and *= arr[i];
    }
    
    return sum - and;
}

function factorial(n)
{
	if(n <= 1)
    {
    	return 1;
    }
    
    return n * factorial(n - 1);
}

function randomInt(maxExclusive)
{
	return Math.floor(Math.random() * maxExclusive);
}

function format(num, leftOfDecimal, rightOfDecimal)
{
	var formatted = Number(num);
	formatted = new Intl.NumberFormat(
		'en-IN',
		{ minimumIntegerDigits: leftOfDecimal,
			minimumFractionDigits: rightOfDecimal,
			maximumFractionDigits: rightOfDecimal }
		).format(formatted)
	return formatted;
}


////////////
//PKMN LOGIC
////////////
function Abiliy(slot, twoSlots)
{
	this.slot = slot;
    this.twoSlots = twoSlots;
}

function isStatItem(item)
{
	return item >= 0 && item < NUM_STATS;
}

function getSpecies(p1Species, p2Species)
{
	return (p1Species != "Ditto") ? p1Species : p2Species;
}

function calculateIVs(p1, p2, thresholds)
{
	var chosen = 3;
	var stats = NUM_STATS;
	var setStat = INVALID;
	var parents = [p1, p2];
    
	
	var statProbs = new Array(NUM_STATS);
	for(var i = 0; i < NUM_STATS; ++i)
	{
		statProbs[i] = {'chosen':0, 'notChosen':0};
		var t = thresholds[i];
		statProbs[i].chosen = 0.5 * (p1.ivs[i] >= t) + 0.5 * (p2.ivs[i] >= t);
		statProbs[i].notChosen = (NUM_IVS - thresholds[i]) / NUM_IVS;
	}
	
	var probs = new Array(NUM_STATS + 1).fill(0);
	var totalProbIsZero = false;
	
    if(isStatItem(p1.item) || isStatItem(p2.item))
    {
    	//assuming both parents aren't going to have one
    	var p = isStatItem(p1.item) ? p1 : p2;
        var meetsThreshold = p.ivs[p.item] >= thresholds[p.item];
		if(!meetsThreshold)
		{
			totalProbIsZero = true;
		}
		
    	--chosen;
		--stats;
		
		setStat = p.item;
		probs[setStat] = meetsThreshold ? 1 : 0;
    }
    
    if(p1.item == DESTINY_KNOT || p2.item == DESTINY_KNOT)
    {	
    	chosen += 2;
    }
	
	var notChosen = stats - chosen;
	var count = factorial(stats) / (factorial(chosen) * factorial(notChosen));

	for(i = 0; i < NUM_STATS; ++i)
	{
		if(i == setStat)
		{
			continue;
		}

		var x1 = i;
		if(notChosen <= 1)
		{
			probs = calc(probs, statProbs, setStat, x1);
			continue;
		}
	
		for(var j = i + 1; j < NUM_STATS; ++j)
		{
			if(j == setStat)
			{
				continue;
			}
	
			x2 = j;
		
			if(notChosen <= 2)
			{
				probs = calc(probs, statProbs, setStat, x1, x2);
				continue;
			}
		
			for(var k = j + 1; k < NUM_STATS; ++k)
			{
				if(k == setStat)
				{
					continue;
				}
			
				x3 = k;
				probs = calc(probs, statProbs, setStat, x1, x2, x3);
			}
		}
	}
	
	for(var x = 0; x <= NUM_STATS; ++x)
	{
		if(x != setStat)
		{
			probs[x] /= count;
		}
	}
	
	if(totalProbIsZero)
	{
		probs[NUM_STATS] = 0;
	}
    
    return probs;
}

function calc(probs, statProbs, setStat, x1, x2 = INVALID, x3 = INVALID)
{
	var allProb = 1;
	var thisProb = 1;
	for(var i = 0; i < NUM_STATS; ++i)
	{
		if(i == setStat)
		{
			continue;
		}
		else if(i == x1 || i == x2 || i == x3)
		{
			thisProb = statProbs[i].notChosen;
		}
		else
		{
			thisProb = statProbs[i].chosen;
		}
		
		allProb *= thisProb;
		probs[i] +=  thisProb;
	}
    
	probs[NUM_STATS] += allProb;
    return probs;
}

function calculateAbility(p1, p2, slot)
{
	if(slot == DONT_CARE)
	{
		return 1;
	}
	
	var mother =
		(p1.gender == FEMALE || p1.species == "Ditto") ?
    	p1 :
    	p2;
    
    var father = (p1 == mother) ? p2 : p1;

	//handle non-Ditto mother
	if(mother.species != "Ditto")
    {
    	//handle desiring hidden ability
    	if(slot == 3)
        {
        	return (mother.ability.slot == 3) ? 0.8 : 0;
        }
    
    	//handle desiring a non-hidden, single-slot ability
    	if(!mother.ability.twoSlots)
        {
        	return (mother.ability.slot == 3) ? 0.2 : 1;
        }
    
    	//handle desiring a non-hidden, two-slot ability
    	return (mother.ability.slot == 3) ? 0.1 : 0.5;
    }
    //handle Ditto mother and HA father
    else if (father.ability.slot == 3)
    {
    	if(slot == 3)
        {
        	return 0.6;
        }
        else if(father.ability.twoSlots)
        {
        	return 0.2;
        }
        else
        {
        	return 0.4;
        }
    }
    //handle Ditto mother and non-HA father
    else
    {
    	if(slot == 3)
        {
        	return 0;
        }
        else if(father.ability.twoSlots)
        {
        	return 0.5;
        }
        else
        {
        	return 1;
        }
    }
}

function calculateNature(p1, p2, nature)
{
	
	if(nature == DONT_CARE)
	{
		return 1;
	}
	else if(p1.item == EVERSTONE)
    {
    	return p1.nature == nature ? 1 : 0;
    }
    else if(p2.item == EVERSTONE)
    {
    	return p2.nature == nature ? 1 : 0;
    }
    
    
    return 1.0 / NUM_NATURES;
}

////////////
//INIT
////////////
updateAll();