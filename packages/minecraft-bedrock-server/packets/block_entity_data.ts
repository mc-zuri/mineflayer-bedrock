export function block_entity_data() {
  return {
    position: {
      x: -9,
      y: 0,
      z: 3,
    },
    nbt: {
      type: "compound",
      name: "",
      value: {
        id: {
          type: "string",
          value: "Chest",
        },
        isMovable: {
          type: "byte",
          value: 1,
        },
        pairlead: {
          type: "byte",
          value: 1,
        },
        pairx: {
          type: "int",
          value: -9,
        },
        pairz: {
          type: "int",
          value: 4,
        },
        x: {
          type: "int",
          value: -9,
        },
        y: {
          type: "int",
          value: 0,
        },
        z: {
          type: "int",
          value: 3,
        },
      },
    },
  };
}
