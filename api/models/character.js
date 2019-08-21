module.exports = (mongoose) => {
  return mongoose.model('Character', {
    name : String,
    player : mongoose.Schema.ObjectId,
    occupation : String,
    age : Number,
    sex : String,
    residence : String,
    birthplace : String,
    characteristics : {
      strength: Number,
      constitution: Number,
      size : Number,
      dexterity : Number,
      apparence : Number,
      intelligence : Number,
      power : Number,
      education : Number,
      move : Number
    },
    attributes : {
      sanity : {
        current : Number,
        max : Number
      },
      magic : {
        current : Number,
        max : Number
      },
      luck : {
        current : Number,
        max : Number
      },
      health : {
        current : Number,
        max : Number
      }
    },
    skills : {
      accounting : {type: Number, default: 5},
      animalHandling : {type: Number, default: 5},
      anthropology : {type: Number, default: 1},
      appraise : {type: Number, default: 5},
      archeology : {type: Number, default: 1},
      artsAndCrafts : {
        acting : {type: Number, default: 5},
        barber : {type: Number, default: 5},
        calligraphy : {type: Number, default: 5},
        carpentry : {type: Number, default: 5},
        cook : {type: Number, default: 5},
        dance : {type: Number, default: 5},
        fineArt : {type: Number, default: 5},
        forgery : {type: Number, default: 5},
        painting : {type: Number, default: 5},
        photography : {type: Number, default: 5},
        pottery : {type: Number, default: 5},
        scuplting : {type: Number, default: 5},
        singer : {type: Number, default: 5},
        writer : {type: Number, default: 5},
      },
      artillery : {type: Number, default: 1},
      charm : {type: Number, default: 15},
      climb : {type: Number, default: 20},
      creditRating : {type: Number, default: 0},
      cthulhuMythos : {type: Number, default: 0},
      demolitions : {type: Number, default: 1},
      disguise : {type: Number, default: 5},
      diving : {type: Number, default: 1},
      dodge : {type: Number, default: -1},
      driveAuto : {type: Number, default: 20},
      electronicRepair : {type: Number, default: 10},
      electronics : {type: Number, default: 1},
      fastTalk : {type: Number, default: 5},
      fighting : {
        axe : {type: Number, default: 15},
        brawl : {type: Number, default: 25},
        chainsaw : {type: Number, default: 10},
        flail : {type: Number, default: 10},
        garrote : {type: Number, default: 15},
        sword : {type: Number, default: 20},
        whip : {type: Number, default: 5}
      },
      firearms : {
        bow : {type: Number, default: 15},
        flamethrower : {type: Number, default: 10},
        handgun : {type: Number, default: 20},
        heavyWeapons : {type: Number, default: 10},
        machineGun : {type: Number, default: 10},
        rifle : {type: Number, default: 25},
        shotgun : {type: Number, default: 25},
        spear : {type: Number, default: 20},
        subMachineGun : {type: Number, default: 15}
      },
      firstAid : {type: Number, default: 30},
      history : {type: Number, default: 5},
      hypnosis : {type: Number, default: 1},
      intimidate : {type: Number, default: 15},
      jump : {type: Number, default: 20},
      languageOwn : {type: Number, default: -1},
      languageOther : {type: Number, default: 1},
      law : {type: Number, default: 5},
      libraryUse : {type: Number, default: 20},
      listen : {type: Number, default: 20},
      locksmith : {type: Number, default: 1},
      lore : {
        dream : {type: Number, default: 1},
        necronomicon : {type: Number, default: 1},
        alien : {type: Number, default: 1},
        vampire : {type: Number, default: 1},
        werewolf : {type: Number, default: 1},
        yaddithian : {type: Number, default: 1}
      },
      mechanicalRepair : {type: Number, default: 10},
      medecine : {type: Number, default: 1},
      naturalWorld : {type: Number, default: 10},
      navigate : {type: Number, default: 10},
      occult : {type: Number, default: 5},
      operateHeavyMachinery : {type: Number, default: 1},
      persuade : {type: Number, default: 10},
      pilot : {type: Number, default: 1},
      psychoanalysis : {type: Number, default: 1},
      psychology : {type: Number, default: 10},
      readLips : {type: Number, default: 1},
      ride : {type: Number, default: 5},
      science : {
        astronomy : {type: Number, default: 1},
        biology : {type: Number, default: 1},
        botany : {type: Number, default: 1},  
        chemistry : {type: Number, default: 1},
        cryptology : {type: Number, default: 1},
        forensics : {type: Number, default: 1},
        geology : {type: Number, default: 1},
        mathematics : {type: Number, default: 1},
        meteorology : {type: Number, default: 1},
        pharmacy : {type: Number, default: 1},
        physics : {type: Number, default: 1},
        zoology : {type: Number, default: 15}
      },
      sleightOfHand : {type: Number, default: 10},
      spotHidden : {type: Number, default: 25},
      stealth : {type: Number, default: 20},
      survival : {type: Number, default: 10},
      swim : {type: Number, default: 20},
      throw : {type: Number, default: 20},
      track : {type: Number, default: 10}
    },
    weapons : [mongoose.Schema.ObjectId],
    combat : {
      bonus : Number,
      build : Number
    },
    backstory : {
      personalDescription : String,
      ideology : String,
      significantPeople : String,
      meaningfulLocations : String,
      treasuredPosessions : String,
      traits : String,
      InjuriesAndScars : String,
      phobiasAndManias : String,
      ArcaneTomesSpellsAndArtifacts : String,
      EncountersWithStrangeEntities : String
    },
    gear : [mongoose.Schema.ObjectId],
    cash : {
      level : String,
      liquidity : Number,
      assets : Number,
      details : String
    }
  });
};