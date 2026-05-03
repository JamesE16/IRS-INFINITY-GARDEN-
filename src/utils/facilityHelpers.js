import { ROOMS } from '../data/rooms';

const roomCatalogByExternalId = new Map(ROOMS.map((room) => [room.id, room]));
const roomCatalogByName = new Map(ROOMS.map((room) => [room.name, room]));

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const findCatalogRoom = (facility) =>
  roomCatalogByExternalId.get(facility.external_id || facility.externalId) ||
  roomCatalogByName.get(facility.name) ||
  null;

export const normalizeFacility = (facility) => {
  if (!facility) return null;

  const catalogRoom = findCatalogRoom(facility);
  const externalId = facility.external_id || facility.externalId || catalogRoom?.id || `facility-${facility.id}`;
  const capacity = Number(facility.capacity ?? facility.guests ?? catalogRoom?.guests ?? 1);
  const price = Number(facility.price ?? catalogRoom?.price ?? 0);
  const availability = facility.availability_status;

  return {
    id: facility.id,
    backendId: facility.id,
    publicId: externalId,
    externalId,
    name: facility.name || catalogRoom?.name || 'Unnamed Facility',
    type: facility.type || catalogRoom?.type || 'Room',
    subtype: facility.subtype || catalogRoom?.subtype || facility.type || 'Standard',
    desc: facility.description || catalogRoom?.desc || '',
    description: facility.description || catalogRoom?.desc || '',
    guests: capacity,
    size: Number(facility.size ?? catalogRoom?.size ?? 0),
    beds: facility.beds || catalogRoom?.beds || '',
    price,
    available: availability ? availability.is_available : facility.available ?? true,
    availability_status: availability || null,
    amenities: toArray(facility.amenities).length ? toArray(facility.amenities) : catalogRoom?.amenities || [],
    features: toArray(facility.features).length ? toArray(facility.features) : catalogRoom?.features || [],
    img: facility.image_url || facility.img || catalogRoom?.img || '',
    isDynamic: true,
    canBook: true,
  };
};

export const buildGuestFacilities = (backendFacilities = []) => {
  const normalizedBackend = backendFacilities.map(normalizeFacility).filter(Boolean);
  const backendByExternalId = new Map(
    normalizedBackend.filter((room) => room.externalId).map((room) => [room.externalId, room])
  );
  const backendByName = new Map(normalizedBackend.map((room) => [room.name, room]));

  const mergedCatalog = ROOMS.map((room) => {
    const matchedBackend = backendByExternalId.get(room.id) || backendByName.get(room.name);

    if (matchedBackend) {
      return {
        ...room,
        ...matchedBackend,
        publicId: room.id,
        externalId: room.id,
        backendId: matchedBackend.backendId,
        canBook: true,
      };
    }

    return {
      ...room,
      publicId: room.id,
      externalId: room.id,
      backendId: null,
      isDynamic: false,
      canBook: false,
      availability_status: null,
    };
  });

  const backendOnly = normalizedBackend
    .filter((room) => !roomCatalogByExternalId.has(room.externalId) && !roomCatalogByName.has(room.name))
    .map((room) => ({
      ...room,
      publicId: room.publicId || room.externalId,
      canBook: true,
    }));

  return [...mergedCatalog, ...backendOnly];
};

export const getCatalogRoom = (roomRef) => {
  if (!roomRef) return null;
  return (
    roomCatalogByExternalId.get(roomRef.externalId || roomRef.external_id || roomRef.publicId || roomRef.id) ||
    roomCatalogByName.get(roomRef.name) ||
    null
  );
};
