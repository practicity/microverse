// infrastructure.js — streets, roads, lights
export default [

    {
        name:  "Sorrento Street North East",
        model: "infrastructures/transport_street_straight.glb",
        mapX: 20,
        mapYFrom: 70, mapYTo: 80,
        mapZ: 0.005,
        rotationY: Math.PI, //left to right orientation
        scale: 0.125   // was 0.5 (÷4)
    },

    {
        name:  "Airport Street East",
        model: "infrastructures/transport_street_straight.glb",
        mapXFrom: 0, mapXTo: 49, mapY: 80,
        mapZ: 0.005,
        rotationY: Math.PI / 2,
        scale: 0.125
    },

    {
        name:  "Airport Street East & West T",
        model: "infrastructures/transport_street_t.glb",
        mapX: 50, mapY: 80,
        mapZ: 0.005,
        rotationY: Math.PI*1.5,
        scale: 0.125
    },

    {
        name:  "Airport Street West",
        model: "infrastructures/transport_street_straight.glb",
        mapXFrom: 51, mapXTo: 100, mapY: 80,
        mapZ: 0.005,
        rotationY: Math.PI / 2,
        scale: 0.125
    },

    {
        name:  "Kolb Street North",
        model: "infrastructures/transport_street_straight.glb",
        mapX: 50,
        mapYFrom: 51, mapYTo: 79,
        mapZ: 0.005,
        rotationY: Math.PI,
        scale: 0.125   // was 0.5 (÷4)
    },

    {
        name:  "Montesori Street East",
        model: "infrastructures/transport_street_straight.glb",
        mapXFrom: 0, mapXTo: 49, mapY: 50,
        mapZ: 0.005,
        rotationY: Math.PI / 2,
        scale: 0.125
    },
    {
        name:  "Montesori East to East Lights Right",
        model: "infrastructures/transport_street_light.glb",
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
        model: "infrastructures/transport_street_light.glb",
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
        model: "infrastructures/transport_street_straight.glb",
        mapXFrom: 51, mapXTo: 100, mapY: 50,
        mapZ: 0.005,
        rotationY: Math.PI / 2,
        scale: 0.125   // was 0.5 (÷4)
    },
    {
        name:  "Kolb Street South",
        model: "infrastructures/transport_street_straight.glb",
        mapX: 50, mapYFrom: 0, mapYTo: 49,
        mapZ: 0.005,
        rotationY: Math.PI,
        scale: 0.125   // was 0.5 (÷4)
    },
    {
        name:  "Learners' Crossroad",
        model: "infrastructures/transport_street_crosswalk.glb",
        mapX: 50, mapY: 50,
        mapZ: 0.005,
        rotationY: Math.PI,
        scale: 0.125   // was 0.5 (÷4)
    },

    {
        name:  "I50",
        //north
        model: "infrastructures/transport_road.glb",
        mapXFrom: 1 , mapXTo: 100,
        mapY: 70,
        mapZ: -0.0,
        rotationY: Math.PI,
        scale: 0.012   // was 0.5 (÷4)
    },

];
