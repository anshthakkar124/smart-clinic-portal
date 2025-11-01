const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Organization = require('./models/Organization');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});
    console.log('Cleared existing data');

    // Create superadmin first
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'superadmin@smartclinic.com',
      password: 'admin123456',
      phone: '(555) 000-0000',
      dateOfBirth: new Date('1990-01-01'),
      role: 'superadmin',
      address: {
        street: '1 Admin Street',
        city: 'Admin City',
        state: 'AC',
        zipCode: '00000'
      },
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '(555) 000-0001',
        relationship: 'spouse'
      }
    });

    await superAdmin.save();
    console.log('Created superadmin user');

    // Create sample organizations
    const organizations = [
      {
        name: 'City General Hospital',
        type: 'hospital',
        description: 'A comprehensive healthcare facility serving the community',
        createdBy: superAdmin._id,
        address: {
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        contact: {
          phone: '(555) 123-4567',
          email: 'info@citygeneral.com',
          website: 'https://citygeneral.com'
        },
        specialties: ['general', 'cardiology', 'emergency'],
        services: [
          { name: 'General Consultation', duration: 30, price: 150 },
          { name: 'Cardiology Checkup', duration: 45, price: 200 },
          { name: 'Emergency Care', duration: 60, price: 300 }
        ],
        operatingHours: {
          monday: { open: '08:00', close: '20:00', closed: false },
          tuesday: { open: '08:00', close: '20:00', closed: false },
          wednesday: { open: '08:00', close: '20:00', closed: false },
          thursday: { open: '08:00', close: '20:00', closed: false },
          friday: { open: '08:00', close: '20:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: false }
        }
      },
      {
        name: 'Downtown Medical Clinic',
        type: 'clinic',
        description: 'Family medicine and specialized care clinic',
        createdBy: superAdmin._id,
        address: {
          street: '456 Oak Avenue',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        contact: {
          phone: '(555) 987-6543',
          email: 'contact@downtownmedical.com',
          website: 'https://downtownmedical.com'
        },
        specialties: ['general', 'pediatrics', 'dermatology'],
        services: [
          { name: 'Family Medicine', duration: 30, price: 120 },
          { name: 'Pediatric Care', duration: 30, price: 100 },
          { name: 'Dermatology Consultation', duration: 45, price: 180 }
        ],
        operatingHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '10:00', close: '15:00', closed: false },
          sunday: { open: '10:00', close: '15:00', closed: false }
        }
      },
      {
        name: 'Sunset Health Center',
        type: 'medical_center',
        description: 'Multi-specialty health center with advanced facilities',
        createdBy: superAdmin._id,
        address: {
          street: '789 Sunset Boulevard',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          country: 'USA'
        },
        contact: {
          phone: '(555) 456-7890',
          email: 'info@sunsethealth.com',
          website: 'https://sunsethealth.com'
        },
        specialties: ['orthopedics', 'neurology', 'psychiatry'],
        services: [
          { name: 'Orthopedic Consultation', duration: 45, price: 250 },
          { name: 'Neurology Assessment', duration: 60, price: 300 },
          { name: 'Psychiatry Session', duration: 50, price: 200 }
        ],
        operatingHours: {
          monday: { open: '08:00', close: '19:00', closed: false },
          tuesday: { open: '08:00', close: '19:00', closed: false },
          wednesday: { open: '08:00', close: '19:00', closed: false },
          thursday: { open: '08:00', close: '19:00', closed: false },
          friday: { open: '08:00', close: '19:00', closed: false },
          saturday: { open: '09:00', close: '16:00', closed: false },
          sunday: { open: '09:00', close: '16:00', closed: false }
        }
      }
    ];

    // Create organizations one by one to trigger pre-save hooks
    const createdOrganizations = [];
    for (const orgData of organizations) {
      const org = new Organization(orgData);
      await org.save();
      createdOrganizations.push(org);
    }
    console.log(`Created ${createdOrganizations.length} organizations`);

    // Create admin users for each organization
    for (let i = 0; i < createdOrganizations.length; i++) {
      const org = createdOrganizations[i];
      const admin = new User({
        name: `Admin ${org.name}`,
        email: `admin@${org.slug}.com`,
        password: 'admin123456',
        phone: `(555) ${100 + i}${100 + i}${100 + i}`,
        dateOfBirth: new Date('1985-01-01'),
        role: 'admin',
        organizationId: org._id,
        address: {
          street: org.address.street,
          city: org.address.city,
          state: org.address.state,
          zipCode: org.address.zipCode
        },
        emergencyContact: {
          name: 'Emergency Contact',
          phone: `(555) ${200 + i}${200 + i}${200 + i}`,
          relationship: 'spouse'
        }
      });

      await admin.save();
      console.log(`Created admin for ${org.name}`);
    }

    // Create doctor users for each organization
    for (let i = 0; i < createdOrganizations.length; i++) {
      const org = createdOrganizations[i];
      const doctor = new User({
        name: `Dr. ${org.name.split(' ')[0]}`,
        email: `doctor@${org.slug}.com`,
        password: 'doctor123456',
        phone: `(555) ${300 + i}${300 + i}${300 + i}`,
        dateOfBirth: new Date('1980-01-01'),
        role: 'doctor',
        organizationId: org._id,
        address: {
          street: org.address.street,
          city: org.address.city,
          state: org.address.state,
          zipCode: org.address.zipCode
        },
        emergencyContact: {
          name: 'Emergency Contact',
          phone: `(555) ${400 + i}${400 + i}${400 + i}`,
          relationship: 'spouse'
        }
      });

      await doctor.save();
      console.log(`Created doctor for ${org.name}`);
    }

    // Create sample patient users
    const patients = [
      {
        name: 'John Doe',
        email: 'patient@demo.com',
        phone: '(555) 111-1111',
        dateOfBirth: new Date('1995-05-15')
      },
      {
        name: 'Jane Smith',
        email: 'jane@demo.com',
        phone: '(555) 222-2222',
        dateOfBirth: new Date('1992-08-20')
      },
      {
        name: 'Bob Johnson',
        email: 'bob@demo.com',
        phone: '(555) 333-3333',
        dateOfBirth: new Date('1988-12-10')
      }
    ];

    for (const patientData of patients) {
      const patient = new User({
        ...patientData,
        password: 'patient123456',
        role: 'patient',
        address: {
          street: '123 Patient Street',
          city: 'Patient City',
          state: 'PC',
          zipCode: '12345'
        },
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '(555) 999-9999',
          relationship: 'family'
        }
      });

      await patient.save();
    }

    console.log(`Created ${patients.length} patient users`);

    console.log('\n=== SEED DATA CREATED ===');
    console.log('SuperAdmin: superadmin@smartclinic.com / admin123456');
    console.log('Admin Users: admin@[organization-slug].com / admin123456');
    console.log('Doctor Users: doctor@[organization-slug].com / doctor123456');
    console.log('Patient Users: patient@demo.com, jane@demo.com, bob@demo.com / patient123456');
    console.log('\nOrganizations created:');
    createdOrganizations.forEach(org => {
      console.log(`- ${org.name} (${org.type})`);
    });

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
