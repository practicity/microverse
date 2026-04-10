//objects.js
export const OBJECT_DEFINITIONS = [

    {
        name:  "Sorrento Street North East",
        model: "transport_street_straight.glb",
        mapX: 20, 
        mapYFrom: 70, mapYTo: 80,
        mapZ: 0.005,
        rotationY: Math.PI, //left to right orientation
        scale: 0.125   // was 0.5 (÷4)
    },

    {
        name:  "Airport Street East",
        model: "transport_street_straight.glb",
        mapXFrom: 0, mapXTo: 49, mapY: 80,
        mapZ: 0.005,
        rotationY: Math.PI / 2,
        scale: 0.125
    },

    {
        name:  "Airport Street East & West T",
        model: "transport_street_t.glb",
        mapX: 50, mapY: 80,
        mapZ: 0.005,
        rotationY: Math.PI*1.5,
        scale: 0.125
    },



    {
        name:  "Airport Street West",
        model: "transport_street_straight.glb",
        mapXFrom: 51, mapXTo: 100, mapY: 80,
        mapZ: 0.005,
        rotationY: Math.PI / 2,
        scale: 0.125
    },



    {
        name:  "Kolb Street North",
        model: "transport_street_straight.glb",
        mapX: 50, 
        mapYFrom: 51, mapYTo: 79,
        mapZ: 0.005,
        rotationY: Math.PI,
        scale: 0.125   // was 0.5 (÷4)
    },


    {
        name:  "Montesori Street East",
        model: "transport_street_straight.glb",
        mapXFrom: 0, mapXTo: 49, mapY: 50,
        mapZ: 0.005,
        rotationY: Math.PI / 2,
        scale: 0.125
    },
    {
        name:  "Montesori East to East Lights Right",
        model: "transport_street_light.glb",
        mapXFrom: 1, mapXTo: 100, stepX: 8,
        mapY: 49.55,
        mapZ: 0,
        rotationX: Math.PI ,
        rotationY: Math.PI /2,
        rotationZ: Math.PI ,
        scale: 0.07
    },
    {
        name:  "Montesori East to West Lights LEFT",
        model: "transport_street_light.glb",
        mapXFrom: 4, mapXTo: 96, stepX: 8,
        mapY: 50.42,
        mapZ: 0,
        rotationX: Math.PI,
        rotationY: Math.PI * 1.5,
        rotationZ: Math.PI ,
        scale: 0.07
    },

    {
        name:  "Montesori Street West",
        model: "transport_street_straight.glb",
        mapXFrom: 51, mapXTo: 100, mapY: 50,
        mapZ: 0.005,
        rotationY: Math.PI / 2,
        scale: 0.125   // was 0.5 (÷4)
    },
    {
        name:  "Kolb Street South",
        model: "transport_street_straight.glb",
        mapX: 50, mapYFrom: 0, mapYTo: 49,
        mapZ: 0.005,
        rotationY: Math.PI,
        scale: 0.125   // was 0.5 (÷4)
    },
    {
        name:  "Learners' Crossroad",
        model: "transport_street_crosswalk.glb",
        mapX: 50, mapY: 50,
        mapZ: 0.005,
        rotationY: Math.PI,
        scale: 0.125   // was 0.5 (÷4)
    },

    {
        name:  "I50",
        //north
        model: "transport_road.glb",
        mapXFrom: 1 , mapXTo: 100, 
        mapY: 70,
        mapZ: -0.0,
        rotationY: Math.PI,
        scale: 0.012   // was 0.5 (÷4)
    },



// BUILDINGS-----------------------------------

    {
        locationid: "SMOGSIDE",
        // North East, close to SMOGSIDE Burroughs
        model: "cube.glb",
        interactive: true,
        mapX: 10, mapY: 77,
        mapZ: 0.285,
        rotationY: Math.PI,
        rotationX: Math.PI/2,
        scale: 0.5,
        cameraStartX: 10,
        cameraStartZ: 3,
        cameraStartY: 73,
        cameraStartPitch: 0.6,
        cameraStartYaw: 0,
    },

    {
        locationid: "13THFL",
        // North
        model: "cube.glb",
        interactive: true,
        mapX: 15 , mapY: 82,
        mapZ: 0.285,
        rotationY: Math.PI,
        rotationX: Math.PI/2,
        scale: 0.3,
        cameraStartX: 15,
        cameraStartZ: 2,
        cameraStartY: 79,
        cameraStartPitch: 0.5,
        cameraStartYaw: 0,
    },

    {
        locationid: "ARTWATC",
        // North West
        model: "tmp_artwatc.glb",
        interactive: true,
        mapX: 85 , mapY: 85,
        mapZ: 2.48,
        rotationY: Math.PI,
        rotationX: Math.PI/2,
        rotationZ: Math.PI,
        scale: 0.04,
        cameraStartX: 92,
        cameraStartZ: 4,
        cameraStartY: 86,
        cameraStartPitch: 0.3,
        cameraStartYaw: -1.7,
    },

    {
        locationid: "ARTWAPT",
        // North West
        model: "tmp_artwapt.glb",
        interactive: true,
        mapX: 76 , mapY: 96,
        mapZ: -0.23,
        rotationY: Math.PI*1.5,
        rotationX: Math.PI, // pitch
        rotationZ: Math.PI, // roll
        scale: 1.8,
        cameraStartX: 80,
        cameraStartZ: 20,
        cameraStartY: 55,
        cameraStartPitch: 0.5,
        cameraStartYaw: 0.00,
    },

    {
        locationid : "SIMFAC",
        model: "building_factorysmall.glb",
        interactive: true,
        mapX: 70, 
        mapY: 68,
        mapZ: -0.0,
        scale: 1,
        cameraStartX: 70,
        cameraStartZ: 2,
        cameraStartY: 66,
        cameraStartPitch: 0.5,
        cameraStartYaw: 0,
        rotationY: Math.PI,
    },

    {
        locationid : "COURT",
        model: "building_courthouse.glb",
        interactive: true,
        rotationZ: Math.PI/2, rotationY: Math.PI/2, rotationX: Math.PI * 1.5,
        mapX: 50.76 ,
        mapZ: 0   ,
        mapY: 53,
        rotationY: Math.PI,
        scale: 20,
        cameraStartX: 50.1,
        cameraStartZ: 1.3,
        cameraStartY: 53,
        cameraStartPitch: 0.6,
        cameraStartYaw: 1.2,
    },

    {
        locationid:  "CITYHALL",
        model: "building_cityhallsmall.glb",
        interactive: true,
        rotationZ: Math.PI/2, rotationY: Math.PI/2, rotationX: Math.PI * 1.5,
        mapX: 50.86, mapY: 50.95,
        mapZ: 0.0   ,
        rotationY: Math.PI,
        scale: 20,
        cameraStartX: 50,
        cameraStartZ: 2,
        cameraStartY: 50,
        cameraStartPitch: 0.7,
        cameraStartYaw: 0.8
    },
    

       {
        locationid : "CINEMATRIX",
        model: "cinematrix.glb",
        interactive: true,
        rotationZ: Math.PI/2, rotationY: Math.PI/2, rotationX: Math.PI * 1.5,
        mapX: 50.5 ,
        mapZ: 0   ,
        mapY: 48,
        rotationY: Math.PI,
        scale: 0.1,
        cameraStartX: 50,
        cameraStartZ: 1.3,
        cameraStartY: 47,
        cameraStartPitch: 0.4,
        cameraStartYaw: 0.7,
    },


    {
        locationid : "WBUSC",
        model: "building_skyscraper1.glb",
        interactive: true,
        mapX: 51.1, mapY: 45,
        mapZ: 0.0   ,
        rotationY: Math.PI /2,
        scale: 1,
        cameraStartX: 50.5,
        cameraStartZ: 0.170,
        cameraStartY: 44.5,
        cameraStartPitch: -0.2,
        cameraStartYaw: 0.7,

    },


    {
        locationid: "",
        model: "building_office2.glb",
        interactive: true,
        mapX: 49.1, mapY: 52,
        mapZ: 0.0   ,
        rotationY: Math.PI * 1.5,
        scale: 1,
    },
    {
        locationid:  "BRADIC",
        model: "building_office1.glb",
        mapX: 48.6, mapY: 48.6,
        mapZ: 0,
        rotationY: Math.PI*2,
        scale: 1,
        highlight: true
    },
    {
        name:  "The two guys",
        model: "character_man1.glb",
        mapX: 49.7, mapY: 60,
        mapZ: 0.13,
        rotationY: Math.PI,
        scale: 0.06,
        highlight: true
    },
    {
        name:  "Police Car",
        model: "vehicle_police.glb",
        mapX: 50, 
        mapY: 52,
        rotationY: Math.PI,
        scale: 0.1,
        highlight: true
    },







];
