//objects.js
export const OBJECT_DEFINITIONS = [

    {
        name:  "Montesori Street West",
        model: "transport_street_straight.glb",
        mapXFrom: 0, mapXTo: 49, mapY: 50,
        mapZ: 0.005,
        rotationY: Math.PI / 2,
        scale: 0.125
    },
    {
        name:  "Montesori East to West Lights Right",
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
        name:  "Montesori Street East",
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
        name:  "Kolb Street North",
        model: "transport_street_straight.glb",
        mapX: 50, mapYFrom: 51, mapYTo: 100,
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
        name:  "I5 Eastbound",
        model: "transport_road.glb",
        mapXFrom: 51.68 , mapXTo: 100, 
        mapY: 70,
        mapZ: -0.0,
        rotationY: Math.PI,
        scale: 0.012   // was 0.5 (÷4)
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
        cameraStartZ: 66,
        cameraStartY: 2,
        cameraStartPitch: 0.5,
        cameraStartYaw: 0,
        rotationY: Math.PI,
    },

    {
        locationid : "COURT",
        model: "building_courthouse.glb",
        interactive: true,
        rotationZ: Math.PI/2, rotationY: Math.PI/2, rotationX: Math.PI * 1.5,
        mapX: 50.76 , mapY: 53,
        mapZ: 0   ,
        rotationY: Math.PI,
        scale: 20,
        cameraStartX: 50,
        cameraStartZ: 53,
        cameraStartY: 2,
        cameraStartPitch: 0.5,
        cameraStartYaw: 0,
    },

    {
        name:  "PRACTI.CITY Hall",
        model: "building_cityhallsmall.glb",
        interactive: true,
        description: "The PractiCity Hall was build by the founders of the city in 2014. The municipality Hall delivers several sercices like Social Services, City Roads and Bridges Infrastructure, Schools and Education council and many more",
        urls: ["https://google.com", "https://practi.city"],
        rotationZ: Math.PI/2, rotationY: Math.PI/2, rotationX: Math.PI * 1.5,
        mapX: 50.86, mapY: 50.95,
        mapZ: 0.0   ,
        rotationY: Math.PI,
        scale: 20,
    },
    
    {
        name:  "Wegner Business Center",
        address: "15, Kolb Street Nouth",
        model: "building_skyscraper1.glb",
        interactive: true,
        description: "The Wegner Business Center was build in 2010. This center provides offices and shared services to all company sizes.", 
        urls: ["http://127.0.0.1:4000/practicity-content/addresses/1-kolb-street-south/", "https://practi.city"],

        mapX: 51.1, mapY: 45,
        mapZ: 0.0   ,
        rotationY: Math.PI /2,
        scale: 1,
    },


    {
        name:  "KIM & SAUL Sollicitors",
        address: "1, Kolb Street South",
        model: "building_office2.glb",
        interactive: true,
        description: "The KIM & SAUL Sollicitors was establissed in 2003. This legal office deals with criminal law and corporate law.", 
        urls: ["http://127.0.0.1:4000/practicity-content/addresses/1-kolb-street-south/", "https://practi.city"],

        mapX: 49.1, mapY: 52,
        mapZ: 0.0   ,
        rotationY: Math.PI * 1.5,
        scale: 1,
    },
    {
        name:  "BRADIC Engineering Ltd",
        address: "see later",
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

    {
        name:  "Firestation",
        model: "building_firestation.glb",
        interactive: true,
        description: "The PractiCity proud Firestation. Because fire burns, it is preferable to have profesionals knowing how to extinguish a fire.",
        urls: ["https://google.com", "https://practi.city"],

        mapX: 48.8 , mapY: 60,
        mapZ: 0.285,
        rotationY: Math.PI * 1.5,
        scale: 1.25,
    },
    

];
