import { PrismaClient, AppointmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');

  // ── Salon ──────────────────────────────────────────────────────────────────
  const salon = await prisma.salon.upsert({
    where: { slug: 'salon-elegance' },
    update: {},
    create: {
      name: 'Salon Élégance',
      slug: 'salon-elegance',
      phone: '01 23 45 67 89',
      email: 'contact@salon-elegance.fr',
      address: '12 rue de la Paix, 75001 Paris',
      timezone: 'Europe/Paris',
    },
  });
  console.log(`Salon: ${salon.name} (${salon.id})`);

  // ── Lier l'admin au salon ──────────────────────────────────────────────────
  await prisma.user.updateMany({
    where: { email: 'admin@salon.com' },
    data: { salonId: salon.id, role: 'SALON_OWNER' },
  });
  console.log('Admin linked to salon');

  // ── AI Config ──────────────────────────────────────────────────────────────
  await prisma.aiConfig.upsert({
    where: { salonId: salon.id },
    update: {},
    create: {
      salonId: salon.id,
      provider: 'OPENAI',
      isEnabled: true,
    },
  });

  // ── Services ───────────────────────────────────────────────────────────────
  const servicesData = [
    { name: 'Coupe homme',         durationMin: 30,  price: 25,  description: 'Coupe + finitions' },
    { name: 'Coupe femme',         durationMin: 45,  price: 35,  description: 'Coupe + brushing inclus' },
    { name: 'Coupe enfant',        durationMin: 20,  price: 18,  description: 'Moins de 12 ans' },
    { name: 'Brushing',            durationMin: 30,  price: 25,  description: 'Brushing seul' },
    { name: 'Coloration',          durationMin: 90,  price: 65,  description: 'Coloration complète' },
    { name: 'Balayage',            durationMin: 120, price: 85,  description: 'Balayage + soin' },
    { name: 'Mèches',              durationMin: 90,  price: 70,  description: 'Mèches classiques' },
    { name: 'Soin profond',        durationMin: 30,  price: 20,  description: 'Masque + rinçage' },
    { name: 'Barbe',               durationMin: 20,  price: 15,  description: 'Taille + contour' },
    { name: 'Coupe + Barbe',       durationMin: 45,  price: 35,  description: 'Pack homme complet' },
  ];

  const services: Record<string, string> = {};
  for (const s of servicesData) {
    const svc = await prisma.service.upsert({
      where: { id: `seed-svc-${s.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: {},
      create: {
        id: `seed-svc-${s.name.replace(/\s+/g, '-').toLowerCase()}`,
        salonId: salon.id,
        name: s.name,
        durationMin: s.durationMin,
        price: s.price,
        description: s.description,
      },
    });
    services[s.name] = svc.id;
  }
  console.log(`Services: ${Object.keys(services).length} created`);

  // ── Staff ──────────────────────────────────────────────────────────────────
  const staffData = [
    {
      id: 'seed-staff-sarah',
      firstName: 'Sarah',
      lastName: 'Leblanc',
      email: 'sarah@salon-elegance.fr',
      phone: '06 11 22 33 44',
      color: '#8B5CF6',
      services: ['Coupe femme', 'Brushing', 'Coloration', 'Balayage', 'Mèches', 'Soin profond'],
    },
    {
      id: 'seed-staff-thomas',
      firstName: 'Thomas',
      lastName: 'Martin',
      email: 'thomas@salon-elegance.fr',
      phone: '06 55 66 77 88',
      color: '#0EA5E9',
      services: ['Coupe homme', 'Coupe enfant', 'Barbe', 'Coupe + Barbe', 'Soin profond'],
    },
    {
      id: 'seed-staff-julie',
      firstName: 'Julie',
      lastName: 'Dupont',
      email: 'julie@salon-elegance.fr',
      phone: '06 99 00 11 22',
      color: '#F59E0B',
      services: ['Coupe femme', 'Coupe enfant', 'Brushing', 'Coloration', 'Balayage', 'Soin profond'],
    },
  ];

  const staffIds: Record<string, string> = {};
  for (const m of staffData) {
    await prisma.staffService.deleteMany({ where: { staffId: m.id } });
    const member = await prisma.staff.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        salonId: salon.id,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        phone: m.phone,
        color: m.color,
      },
    });
    for (const svcName of m.services) {
      await prisma.staffService.upsert({
        where: { staffId_serviceId: { staffId: member.id, serviceId: services[svcName] } },
        update: {},
        create: { staffId: member.id, serviceId: services[svcName] },
      });
    }
    staffIds[m.firstName] = member.id;
  }
  console.log(`Staff: ${Object.keys(staffIds).length} created`);

  // ── Disponibilités (lundi–samedi 9h–18h) ──────────────────────────────────
  const workDays = [1, 2, 3, 4, 5, 6]; // lun–sam
  for (const staffId of Object.values(staffIds)) {
    await prisma.staffAvailability.deleteMany({ where: { staffId } });
    for (const day of workDays) {
      await prisma.staffAvailability.create({
        data: { staffId, dayOfWeek: day, startTime: '09:00', endTime: '18:00' },
      });
    }
  }
  console.log('Availability: created for all staff');

  // ── Clients ────────────────────────────────────────────────────────────────
  const clientsData = [
    { id: 'seed-client-marie',   firstName: 'Marie',   lastName: 'Dubois',   phone: '06 10 20 30 40', email: 'marie.dubois@email.fr' },
    { id: 'seed-client-julien',  firstName: 'Julien',  lastName: 'Martin',   phone: '06 50 60 70 80', email: 'julien.martin@email.fr' },
    { id: 'seed-client-sophie',  firstName: 'Sophie',  lastName: 'Bernard',  phone: '06 91 82 73 64', email: 'sophie.bernard@email.fr' },
    { id: 'seed-client-lucas',   firstName: 'Lucas',   lastName: 'Petit',    phone: '07 11 22 33 44', email: 'lucas.petit@email.fr' },
    { id: 'seed-client-camille', firstName: 'Camille', lastName: 'Moreau',   phone: '07 55 44 33 22', email: 'camille.moreau@email.fr' },
    { id: 'seed-client-pierre',  firstName: 'Pierre',  lastName: 'Leroy',    phone: '06 77 88 99 00', email: 'pierre.leroy@email.fr' },
    { id: 'seed-client-emma',    firstName: 'Emma',    lastName: 'Simon',    phone: '07 12 34 56 78', email: 'emma.simon@email.fr' },
    { id: 'seed-client-nicolas', firstName: 'Nicolas', lastName: 'Laurent',  phone: '06 33 44 55 66', email: null },
  ];

  const clientIds: Record<string, string> = {};
  for (const c of clientsData) {
    const client = await prisma.client.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        salonId: salon.id,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        email: c.email ?? undefined,
      },
    });
    clientIds[c.firstName] = client.id;
  }
  console.log(`Clients: ${Object.keys(clientIds).length} created`);

  // ── Rendez-vous ────────────────────────────────────────────────────────────
  // Dates relatives à aujourd'hui
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function slot(daysOffset: number, hour: number, minute = 0): Date {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  function addMinutes(date: Date, min: number): Date {
    return new Date(date.getTime() + min * 60 * 1000);
  }

  // Supprimer les anciens RDV seed
  await prisma.appointmentService.deleteMany({
    where: { appointment: { salonId: salon.id } },
  });
  await prisma.appointment.deleteMany({ where: { salonId: salon.id } });

  const appointmentsData = [
    // ── Aujourd'hui ──
    { staffKey: 'Sarah',  clientKey: 'Marie',   svcKey: 'Coupe femme',   startSlot: slot(0, 9, 0),  status: AppointmentStatus.CONFIRMED },
    { staffKey: 'Thomas', clientKey: 'Julien',  svcKey: 'Coupe + Barbe', startSlot: slot(0, 9, 0),  status: AppointmentStatus.CONFIRMED },
    { staffKey: 'Julie',  clientKey: 'Sophie',  svcKey: 'Coloration',    startSlot: slot(0, 9, 0),  status: AppointmentStatus.IN_PROGRESS },
    { staffKey: 'Sarah',  clientKey: 'Camille', svcKey: 'Balayage',      startSlot: slot(0, 10, 0), status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Thomas', clientKey: 'Lucas',   svcKey: 'Coupe homme',   startSlot: slot(0, 10, 0), status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Julie',  clientKey: 'Emma',    svcKey: 'Brushing',      startSlot: slot(0, 11, 30),status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Sarah',  clientKey: 'Marie',   svcKey: 'Soin profond',  startSlot: slot(0, 14, 0), status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Thomas', clientKey: 'Pierre',  svcKey: 'Barbe',         startSlot: slot(0, 14, 30),status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Julie',  clientKey: 'Nicolas', svcKey: 'Coupe femme',   startSlot: slot(0, 15, 0), status: AppointmentStatus.SCHEDULED },
    // ── Demain ──
    { staffKey: 'Sarah',  clientKey: 'Sophie',  svcKey: 'Mèches',        startSlot: slot(1, 9, 30), status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Thomas', clientKey: 'Nicolas', svcKey: 'Coupe homme',   startSlot: slot(1, 10, 0), status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Julie',  clientKey: 'Marie',   svcKey: 'Balayage',      startSlot: slot(1, 10, 0), status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Sarah',  clientKey: 'Emma',    svcKey: 'Coupe femme',   startSlot: slot(1, 14, 0), status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Thomas', clientKey: 'Julien',  svcKey: 'Coupe + Barbe', startSlot: slot(1, 14, 0), status: AppointmentStatus.SCHEDULED },
    // ── Dans 2 jours ──
    { staffKey: 'Sarah',  clientKey: 'Camille', svcKey: 'Coloration',    startSlot: slot(2, 9, 0),  status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Julie',  clientKey: 'Sophie',  svcKey: 'Brushing',      startSlot: slot(2, 11, 0), status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Thomas', clientKey: 'Lucas',   svcKey: 'Coupe homme',   startSlot: slot(2, 11, 0), status: AppointmentStatus.SCHEDULED },
    // ── Dans 3 jours ──
    { staffKey: 'Sarah',  clientKey: 'Pierre',  svcKey: 'Coupe femme',   startSlot: slot(3, 10, 0), status: AppointmentStatus.SCHEDULED },
    { staffKey: 'Julie',  clientKey: 'Emma',    svcKey: 'Mèches',        startSlot: slot(3, 14, 0), status: AppointmentStatus.SCHEDULED },
    // ── Hier (passés) ──
    { staffKey: 'Sarah',  clientKey: 'Marie',   svcKey: 'Brushing',      startSlot: slot(-1, 9, 0), status: AppointmentStatus.COMPLETED },
    { staffKey: 'Thomas', clientKey: 'Lucas',   svcKey: 'Coupe + Barbe', startSlot: slot(-1, 10, 0),status: AppointmentStatus.COMPLETED },
    { staffKey: 'Julie',  clientKey: 'Camille', svcKey: 'Balayage',      startSlot: slot(-1, 9, 0), status: AppointmentStatus.COMPLETED },
    { staffKey: 'Sarah',  clientKey: 'Nicolas', svcKey: 'Coloration',    startSlot: slot(-1, 14, 0),status: AppointmentStatus.CANCELLED },
  ];

  for (const apt of appointmentsData) {
    const svcId = services[apt.svcKey];
    const svcDuration = servicesData.find(s => s.name === apt.svcKey)!.durationMin;
    const endsAt = addMinutes(apt.startSlot, svcDuration);

    await prisma.appointment.create({
      data: {
        salonId: salon.id,
        staffId: staffIds[apt.staffKey],
        clientId: clientIds[apt.clientKey],
        startsAt: apt.startSlot,
        endsAt,
        status: apt.status,
        services: { create: [{ serviceId: svcId }] },
      },
    });
  }
  console.log(`Appointments: ${appointmentsData.length} created`);

  console.log('\n✓ Seed terminé !');
  console.log(`\nConnexion : admin@salon.com / Azerty66`);
  console.log(`Salon ID  : ${salon.id}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
