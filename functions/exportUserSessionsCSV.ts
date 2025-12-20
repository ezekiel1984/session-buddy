import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user sessions
    const sessions = await base44.entities.Session.filter({ uid: user.id }, '-created_date');

    if (sessions.length === 0) {
      return Response.json({ error: 'No sessions found' }, { status: 404 });
    }

    // Create CSV headers
    const headers = [
      'Date',
      'Time',
      'Method',
      'Dosage (mg)',
      'Strain',
      'Tolerance',
      'Body Weight (kg)',
      'Buzz Score',
      'Sober At'
    ];

    // Create CSV rows
    const rows = sessions.map(session => {
      const date = new Date(session.startedAt);
      const soberDate = session.soberAt ? new Date(session.soberAt) : null;
      
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        session.method,
        session.dosageMg,
        session.strain,
        session.tolerance || 'N/A',
        session.bodyWeightKg || 'N/A',
        session.buzzScore,
        soberDate ? soberDate.toLocaleString() : 'N/A'
      ].map(field => `"${field}"`).join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Return CSV file
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="session-buddy-data-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting sessions:', error);
    return Response.json({ 
      error: error.message || 'Failed to export data' 
    }, { status: 500 });
  }
});