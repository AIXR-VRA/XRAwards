/**
 * Event Date Checker for Scheduled Rebuilds
 * 
 * This script checks if a rebuild is needed based on event dates and phases.
 * It uses the same logic as date-checker.ts to determine critical milestones.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get the active event details
 */
async function getActiveEventDetails() {
  const { data: eventDetails } = await supabase
    .from('event_details')
    .select('*')
    .eq('is_active', true)
    .single();

  return eventDetails;
}

/**
 * Determine if a rebuild is needed based on event phase and timing
 */
async function checkIfRebuildNeeded() {
  try {
    const eventDetails = await getActiveEventDetails();
    
    if (!eventDetails) {
      console.log('No active event found');
      return { needed: false, reason: 'No active event' };
    }

    const now = new Date();
    const currentTime = new Date();
    
    // Parse event dates
    const nominationsOpen = eventDetails.nominations_open ? new Date(eventDetails.nominations_open) : null;
    const nominationsClose = eventDetails.nominations_close ? new Date(eventDetails.nominations_close) : null;
    const finalistsAnnounced = eventDetails.finalists_announced ? new Date(eventDetails.finalists_announced) : null;
    const judgingStart = eventDetails.judging_period_start ? new Date(eventDetails.judging_period_start) : null;
    const judgingEnd = eventDetails.judging_period_end ? new Date(eventDetails.judging_period_end) : null;
    const ceremony = eventDetails.awards_ceremony ? new Date(eventDetails.awards_ceremony) : null;

    const reasons = [];
    let shouldRebuild = false;

    // Check for critical phase transitions
    if (nominationsOpen && currentTime < nominationsOpen) {
      // Pre-nominations phase
      const daysUntil = daysBetween(new Date(), nominationsOpen);
      if (daysUntil <= 1) {
        shouldRebuild = true;
        reasons.push(`Nominations opening in ${daysUntil} day(s)`);
      }
    } else if (nominationsOpen && nominationsClose && currentTime >= nominationsOpen && currentTime <= nominationsClose) {
      // Nominations open phase
      const daysUntil = daysBetween(new Date(), nominationsClose);
      if (daysUntil <= 1) {
        shouldRebuild = true;
        reasons.push(`Nominations closing in ${daysUntil} day(s)`);
      }
    } else if (nominationsClose && finalistsAnnounced && currentTime > nominationsClose && currentTime < finalistsAnnounced) {
      // Nominations closed, waiting for finalists
      const hoursUntil = (finalistsAnnounced - currentTime) / (1000 * 60 * 60);
      if (hoursUntil <= 12) {
        shouldRebuild = true;
        reasons.push(`Finalists announcement in ${Math.ceil(hoursUntil)} hours`);
      }
    } else if (finalistsAnnounced && judgingStart && currentTime >= finalistsAnnounced && currentTime < judgingStart) {
      // Finalists announced, waiting for judging
      const daysUntil = daysBetween(new Date(), judgingStart);
      if (daysUntil <= 1) {
        shouldRebuild = true;
        reasons.push(`Judging starting in ${daysUntil} day(s)`);
      }
    } else if (judgingStart && judgingEnd && currentTime >= judgingStart && currentTime <= judgingEnd) {
      // Judging period
      const daysUntil = daysBetween(new Date(), judgingEnd);
      if (daysUntil <= 1) {
        shouldRebuild = true;
        reasons.push(`Judging ending in ${daysUntil} day(s)`);
      }
    } else if (judgingEnd && ceremony && currentTime > judgingEnd && currentTime < ceremony) {
      // Post-judging, pre-ceremony phase
      const daysUntil = daysBetween(new Date(), ceremony);
      if (daysUntil <= 1) {
        shouldRebuild = true;
        reasons.push(`Ceremony in ${daysUntil} day(s)`);
      }
    } else if (ceremony && currentTime > ceremony) {
      // Post-ceremony - rebuild to show winners
      const hoursSince = (currentTime - ceremony) / (1000 * 60 * 60);
      if (hoursSince <= 6) {
        shouldRebuild = true;
        reasons.push(`Ceremony completed ${Math.ceil(hoursSince)} hours ago`);
      }
    }

    // Additional checks for urgent situations
    const milestones = [
      { date: nominationsOpen, name: 'Nominations Open' },
      { date: nominationsClose, name: 'Nominations Close' },
      { date: finalistsAnnounced, name: 'Finalists Announced' },
      { date: judgingStart, name: 'Judging Starts' },
      { date: judgingEnd, name: 'Judging Ends' },
      { date: ceremony, name: 'Awards Ceremony' }
    ];

    for (const milestone of milestones) {
      if (!milestone.date) continue;
      
      const timeDiff = Math.abs(currentTime - milestone.date);
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Rebuild if we're within 6 hours of any milestone
      if (hoursDiff <= 6) {
        shouldRebuild = true;
        const direction = currentTime > milestone.date ? 'ago' : 'from now';
        reasons.push(`${milestone.name} ${Math.ceil(hoursDiff)} hours ${direction}`);
      }
    }

    return {
      needed: shouldRebuild,
      reason: reasons.length > 0 ? reasons.join(', ') : 'No critical milestones detected',
      eventYear: eventDetails.event_year,
      eventName: eventDetails.event_name
    };

  } catch (error) {
    console.error('Error checking event dates:', error);
    // Default to rebuilding if we can't check dates
    return {
      needed: true,
      reason: 'Error checking dates, rebuilding for safety',
      error: error.message
    };
  }
}

// Main execution
async function main() {
  const result = await checkIfRebuildNeeded();
  
  console.log(`Event: ${result.eventName || 'Unknown'} (${result.eventYear || 'Unknown'})`);
  console.log(`Rebuild needed: ${result.needed}`);
  console.log(`Reason: ${result.reason}`);
  
  if (result.error) {
    console.error(`Error: ${result.error}`);
  }
  
  // Output for GitHub Actions
  if (result.needed) {
    console.log('REBUILD_NEEDED=true');
    console.log(`REBUILD_REASONS=${result.reason}`);
  } else {
    console.log('REBUILD_NEEDED=false');
  }
  
  process.exit(result.needed ? 0 : 1);
}

main().catch(error => {
  console.error('Script failed:', error);
  console.log('REBUILD_NEEDED=true');
  console.log('REBUILD_REASONS=Script error, rebuilding for safety');
  process.exit(0);
});
