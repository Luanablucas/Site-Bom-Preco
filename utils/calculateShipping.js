function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function calculateShipping({ neighborhood, city }) {
  const normalizedCity = normalizeText(city);
  const normalizedNeighborhood = normalizeText(neighborhood);

  if (normalizedCity !== "serra") {
    return {
      available: false,
      deliveryFee: null,
      estimatedDelivery: null,
      message: "Ainda não entregamos nessa cidade."
    };
  }
  
  //// Bairro, valor e frete previamente definidos


  const deliveryZones = {
    "jacaraipe": {
      fee: 5,
      estimatedDelivery: "Entrega em até 2 horas"
    },
    "manguinhos": {
      fee: 7,
      estimatedDelivery: "Entrega em até 3 horas"
    },
    "nova almeida": {
      fee: 8,
      estimatedDelivery: "Entrega em até 3 horas"
    },
    "lagoa de jacaraipe": {
      fee: 6,
      estimatedDelivery: "Entrega em até 2 horas"
    }
  };

  const zone = deliveryZones[normalizedNeighborhood];

  if (!zone) {
    return {
      available: false,
      deliveryFee: null,
      estimatedDelivery: null,
      message: "Ainda não entregamos nesse bairro."
    };
  }

  return {
    available: true,
    deliveryFee: zone.fee,
    estimatedDelivery: zone.estimatedDelivery,
    message: "Entrega disponível."
  };
}

module.exports = { calculateShipping };