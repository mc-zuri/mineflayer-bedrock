export function inventory_transaction() {
  return {
    transaction: {
      legacy: {
        legacy_request_id: 0,
        legacy_transactions: undefined,
      },
      transaction_type: "normal",
      actions: [
        {
          source_type: "container",
          inventory_id: "inventory",
          slot: 0,
          old_item: {
            network_id: 0,
          },
          new_item: {
            network_id: 0,
          },
        },
      ],
      transaction_data: undefined,
    },
  };
}
