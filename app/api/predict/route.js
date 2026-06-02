import { NextResponse } from 'next/server';
import { query, run } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch total crimes grouped by district
    const crimesByDistrict = query(`
      SELECT p.district, COUNT(c.crime_id) AS crime_count 
      FROM crimes c
      JOIN police_stations p ON c.station_id = p.station_id
      GROUP BY p.district
    `);

    // 2. Fetch demographic features
    const demographics = query(`
      SELECT district, literacy_rate, unemployment_rate, poverty_index, police_density 
      FROM demographics
    `);

    // 3. Compute early warning alerts
    const earlyWarnings = [];
    const hotspots = demographics.map(d => {
      const match = crimesByDistrict.find(c => c.district === d.district);
      const crimeCount = match ? match.crime_count : 0;
      
      // Risk Index Formula = (Unemployment * 0.4) + (Poverty * 100 * 0.3) + (CrimeCount * 1.5) - (PoliceDensity * 0.5)
      const riskScore = parseFloat(
        (d.unemployment_rate * 0.4 + d.poverty_index * 30 + crimeCount * 1.5 - d.police_density * 0.5).toFixed(2)
      );

      let riskLevel = "Low";
      if (riskScore > 15) riskLevel = "Critical";
      else if (riskScore > 8) riskLevel = "Medium";

      // Trigger warning alerts based on statistics
      if (d.unemployment_rate > 7.5) {
        earlyWarnings.push({
          district: d.district,
          indicator: "High Unemployment Rate",
          metric: `${d.unemployment_rate}%`,
          alert_msg: `Elevated economic distress in ${d.district} indicates potential spike in property theft (IPC 379) and cyber fraud over next quarter.`,
          priority: "High"
        });
      }

      if (d.police_density < 1.5) {
        earlyWarnings.push({
          district: d.district,
          indicator: "Low Police Patrol Density",
          metric: `${d.police_density} per 10k`,
          alert_msg: `Patrol density below safety threshold in ${d.district}. Response times may degrade during peak hour offenses.`,
          priority: "Medium"
        });
      }

      if (crimeCount > 2) {
        earlyWarnings.push({
          district: d.district,
          indicator: "Crime Rate Acceleration",
          metric: `+${crimeCount} cases registered`,
          alert_msg: `Clustering of violent cases in ${d.district} indicates active gang movements. Immediate network surveillance is advised.`,
          priority: "High"
        });
      }

      return {
        district: d.district,
        crimeCount,
        literacy: d.literacy_rate,
        unemployment: d.unemployment_rate,
        poverty: d.poverty_index,
        density: d.police_density,
        riskScore,
        riskLevel
      };
    });

    // Sort hotspots by risk score descending
    hotspots.sort((a, b) => b.riskScore - a.riskScore);

    // Fetch active gang networks and high-risk nodes
    const networkDensity = query(`
      SELECT known_gang, COUNT(criminal_id) AS member_count 
      FROM criminals 
      WHERE known_gang IS NOT NULL AND known_gang != 'None'
      GROUP BY known_gang
    `);

    networkDensity.forEach(gang => {
      if (gang.member_count >= 3) {
        earlyWarnings.push({
          district: "Bengaluru City",
          indicator: "Gang Syndicate Activity",
          metric: `${gang.known_gang} (${gang.member_count} active)`,
          alert_msg: `High density of members from "${gang.known_gang}" detected in Koramangala. High likelihood of coordinated dacoity crimes.`,
          priority: "Critical"
        });
      }
    });

    // Fetch last 10 audit logs
    const auditLogs = query(`
      SELECT audit_id, user_role, query_text, parsed_sql, execution_time_ms, confidence_score, timestamp 
      FROM audit_trail 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);

    return NextResponse.json({
      hotspots,
      earlyWarnings,
      auditLogs
    });

  } catch (error) {
    console.error("Predict API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
