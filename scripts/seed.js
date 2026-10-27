/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌿 Seeding Amrutam Telemedicine database...');

  // 1. Seed Admin
  const adminPassword = await hashPassword('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@amrutam.co.in' },
    update: { role: 'ADMIN', isActive: true },
    create: {
      email: 'admin@amrutam.co.in',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Amrutam',
          lastName: 'Director',
          phone: '+919876543210',
        },
      },
    },
  });
  console.log(`✓ Admin seeded: ${admin.email}`);

  // 2. Seed Patient
  const patientPassword = await hashPassword('Patient@123456');
  const patient = await prisma.user.upsert({
    where: { email: 'patient@amrutam.co.in' },
    update: { role: 'PATIENT', isActive: true },
    create: {
      email: 'patient@amrutam.co.in',
      passwordHash: patientPassword,
      role: 'PATIENT',
      isActive: true,
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Aarav',
          lastName: 'Mehta',
          phone: '+919811223344',
          bloodGroup: 'O+',
          emergencyContact: '+919811223300',
        },
      },
    },
  });
  console.log(`✓ Patient seeded: ${patient.email}`);

  // 3. Seed Ayurvedic Doctors
  const doctorsData = [
    {
      email: 'dr.ananya@amrutam.co.in',
      firstName: 'Ananya',
      lastName: 'Sharma',
      phone: '+919822334455',
      licenseNumber: 'AYUSH-DEL-2012-0842',
      specialty: 'Panchakarma & Holistic Wellness',
      experienceYears: 12,
      consultationFee: 750,
      rating: 4.95,
      bio: 'Senior Ayurvedic Practitioner specializing in classical Panchakarma detoxification, gut health, stress modulation, and chronic metabolic disorders with 12+ years of clinical excellence.',
      education: 'BAMS (Delhi University), MD Ayurveda (National Institute of Ayurveda, Jaipur)',
      languages: ['English', 'Hindi', 'Sanskrit'],
    },
    {
      email: 'dr.rajesh@amrutam.co.in',
      firstName: 'Rajesh',
      lastName: 'Iyer',
      phone: '+919833445566',
      licenseNumber: 'AYUSH-KER-2009-1193',
      specialty: 'Kayachikitsa & Lifestyle Medicine',
      experienceYears: 15,
      consultationFee: 900,
      rating: 4.88,
      bio: 'Specialist in Rasayana therapies, immunity building, metabolic balance, and personalized Prakriti-based preventative lifestyle counseling.',
      education: 'BAMS (Kerala Ayurveda Academy), Fellowship in Integrative Medicine',
      languages: ['English', 'Hindi', 'Malayalam', 'Tamil'],
    },
    {
      email: 'dr.priya@amrutam.co.in',
      firstName: 'Priya',
      lastName: 'Nambiar',
      phone: '+919844556677',
      licenseNumber: 'AYUSH-KAR-2016-0421',
      specialty: "Prasuti Tantra & Women's Health",
      experienceYears: 8,
      consultationFee: 600,
      rating: 4.92,
      bio: "Dedicated women's holistic healthcare specialist focusing on hormonal harmony, PCOS/PCOD management, post-partum rejuvenation, and Ayurvedic dermatology.",
      education: 'BAMS (Rajiv Gandhi University of Health Sciences, Bangalore)',
      languages: ['English', 'Hindi', 'Kannada'],
    },
    {
      email: 'dr.vikram@amrutam.co.in',
      firstName: 'Vikramaditya',
      lastName: 'Rathore',
      phone: '+919855667788',
      licenseNumber: 'AYUSH-RAJ-2014-0678',
      specialty: 'Shalya Tantra & Joint Rehabilitation',
      experienceYears: 10,
      consultationFee: 800,
      rating: 4.85,
      bio: 'Expert in Marma therapy, joint mobility, spine rehabilitation, musculoskeletal disorders, and chronic arthritis management through Ayurvedic protocols.',
      education: 'BAMS, MS Ayurveda (Shalya Tantra, Banaras Hindu University)',
      languages: ['English', 'Hindi', 'Gujarati'],
    },
  ];

  const docPassword = await hashPassword('Doctor@123456');

  for (const doc of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: { role: 'DOCTOR', isActive: true },
      create: {
        email: doc.email,
        passwordHash: docPassword,
        role: 'DOCTOR',
        isActive: true,
        emailVerified: true,
        profile: {
          create: {
            firstName: doc.firstName,
            lastName: doc.lastName,
            phone: doc.phone,
          },
        },
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {
        specialty: doc.specialty,
        experienceYears: doc.experienceYears,
        consultationFee: doc.consultationFee,
        rating: doc.rating,
        bio: doc.bio,
        education: doc.education,
        languages: doc.languages,
        isActive: true,
        isVerified: true,
      },
      create: {
        userId: user.id,
        licenseNumber: doc.licenseNumber,
        specialty: doc.specialty,
        experienceYears: doc.experienceYears,
        consultationFee: doc.consultationFee,
        rating: doc.rating,
        bio: doc.bio,
        education: doc.education,
        languages: doc.languages,
        isActive: true,
        isVerified: true,
      },
    });

    // Create availability slots for next 3 days
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + dayOffset);
      baseDate.setMinutes(0, 0, 0);

      const hours = [10, 11, 14, 16, 17];
      for (const h of hours) {
        const start = new Date(baseDate);
        start.setHours(h);
        const end = new Date(start);
        end.setHours(h + 1);

        const existingSlot = await prisma.availabilitySlot.findFirst({
          where: {
            doctorId: doctor.id,
            startTime: start,
          },
        });

        if (!existingSlot) {
          await prisma.availabilitySlot.create({
            data: {
              doctorId: doctor.id,
              startTime: start,
              endTime: end,
              isBooked: false,
              consultationType: 'VIDEO',
              price: doc.consultationFee,
            },
          });
        }
      }
    }
    console.log(`✓ Doctor & Slots seeded: ${doc.firstName} ${doc.lastName} (${doc.specialty})`);
  }

  // 4. Seed an initial completed consultation with prescription & payment for demonstration
  const firstDoctor = await prisma.doctor.findFirst({
    include: { availabilitySlots: true },
  });

  if (firstDoctor && firstDoctor.availabilitySlots.length > 0) {
    const slot = firstDoctor.availabilitySlots[0];
    const existingConsultation = await prisma.consultation.findFirst({
      where: { patientId: patient.id, doctorId: firstDoctor.id },
    });

    if (!existingConsultation) {
      const consultation = await prisma.consultation.create({
        data: {
          patientId: patient.id,
          doctorId: firstDoctor.id,
          slotId: slot.id,
          status: 'COMPLETED',
          type: 'VIDEO',
          symptoms: 'Chronic fatigue, sleep disturbance (Vata imbalance), digestive sluggishness (Manda Agni)',
          diagnosis: 'Vata-Pitta Agnimandya with mild insomnia. Recommended Shirodhara and classical Rasayana therapy.',
          notes: 'Patient advised to follow Dinacharya, consume warm spiced milk before bedtime, and avoid cold/processed food.',
          startedAt: new Date(Date.now() - 3600 * 1000),
          endedAt: new Date(),
        },
      });

      await prisma.availabilitySlot.update({
        where: { id: slot.id },
        data: { isBooked: true },
      });

      // Prescription
      await prisma.prescription.createMany({
        data: [
          {
            consultationId: consultation.id,
            medication: 'Amrutam Brainkey Gold Malt',
            dosage: '10g (1 tablespoon)',
            frequency: 'Twice daily with lukewarm milk',
            duration: '30 days',
            instructions: 'Take 30 minutes after breakfast and before sleep for neuro-vitality and sound sleep.',
          },
          {
            consultationId: consultation.id,
            medication: 'Amrutam Kuntal Care Herbal Hair Spa & Oil',
            dosage: 'Gentle scalp massage',
            frequency: 'Thrice weekly',
            duration: '45 days',
            instructions: 'Leave on scalp for 45 minutes before washing with Amrutam Kuntal Care Shampoo.',
          },
          {
            consultationId: consultation.id,
            medication: 'Organic Ashwagandha & Shankhpushpi Churna',
            dosage: '3g with honey/water',
            frequency: 'Once daily at bedtime',
            duration: '21 days',
            instructions: 'Promotes deep restorative sleep and balances aggravated Vata dosha.',
          },
        ],
      });

      // Payment
      await prisma.payment.create({
        data: {
          consultationId: consultation.id,
          userId: patient.id,
          amount: firstDoctor.consultationFee,
          currency: 'INR',
          status: 'COMPLETED',
          transactionId: `TXN-AMRUTAM-${Date.now()}`,
          paymentGateway: 'Razorpay-Simulated',
          paidAt: new Date(),
        },
      });

      console.log('✓ Initial consultation, prescription, and payment demo seeded.');
    }
  }

  console.log('🌿 Seeding completed successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seeding error:', e);
  process.exit(1);
});
