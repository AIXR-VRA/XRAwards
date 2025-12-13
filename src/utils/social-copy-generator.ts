/**
 * Social Copy Generator Utility
 * Generates social media copy templates for finalists and winners
 */

export interface SocialCopyConfig {
  eventYear: string | number;
  finalistName: string;
  category: string;
  organization?: string;
  description?: string;
  websiteUrl?: string;
  eventName?: string;
  isWinner?: boolean;
}

export interface SocialCopyResult {
  twitter: string;
  linkedin: string;
  instagram: string;
  pressRelease: string;
}

// Social media handles
const TWITTER_HANDLES = '@vrawards @aixrorg';
const INSTAGRAM_HANDLES = '@vrawards @unitedxr @aixrorg';
const LINKEDIN_HANDLES = '@unitedXR @aixr';

/**
 * Generate Twitter copy templates
 */
function getTwitterTemplates(config: SocialCopyConfig): string[] {
  const { finalistName, category, isWinner } = config;
  const eventYear = String(config.eventYear);
  const hashtag = `#XRAwards${eventYear.slice(-2)}`;
  const winnersPageUrl = `https://xrawards.aixr.org/winners-and-finalists-${eventYear}`;

  if (isWinner) {
    return [
      `🏆 We won! Thrilled to announce that ${finalistName} is the winner in the ${category} category at the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nSee all winners: ${winnersPageUrl}`,
      `🎉 WINNER! ${finalistName} has won the ${category} category at the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nView all winners: ${winnersPageUrl}`,
      `✨ Incredible news! ${finalistName} is the ${category} category winner at the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nCheck out all winners: ${winnersPageUrl}`,
      `🚀 Proud to announce that ${finalistName} has won the ${category} category at the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nSee all winners: ${winnersPageUrl}`,
      `🎊 We're thrilled to announce that ${finalistName} is the ${category} winner at the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nView all winners: ${winnersPageUrl}`
    ];
  }

  return [
    `🎉 Excited to be a finalist in the ${category} category at the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nSee all finalists: ${winnersPageUrl}`,
    `🏆 Honored to be selected as a finalist for ${finalistName} in the ${category} category at the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nView all finalists: ${winnersPageUrl}`,
    `✨ Amazing news! ${finalistName} is a finalist in the ${category} category for the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nCheck out all finalists: ${winnersPageUrl}`,
    `🚀 Proud to announce that ${finalistName} has been selected as a finalist in the ${category} category at the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nSee all finalists: ${winnersPageUrl}`,
    `🎊 We're thrilled that ${finalistName} is a finalist in the ${category} category for the ${eventYear} XR Awards! ${hashtag} ${TWITTER_HANDLES}\n\nView all finalists: ${winnersPageUrl}`
  ];
}

/**
 * Generate LinkedIn copy templates
 */
function getLinkedInTemplates(config: SocialCopyConfig): string[] {
  const { finalistName, category, isWinner } = config;
  const eventYear = String(config.eventYear);
  const hashtag = `#XRAwards${eventYear.slice(-2)}`;
  const winnersPageUrl = `https://xrawards.aixr.org/winners-and-finalists-${eventYear}`;

  if (isWinner) {
    return [
      `🏆 We are thrilled to announce that ${finalistName} has won the ${category} category at the ${eventYear} XR Awards!\n\nThis incredible achievement is a testament to our team's dedication and innovation in the XR space. We're honored to be recognized among the best in the industry.\n\nView all winners: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`,
      `We are proud to share that ${finalistName} is the winner of the ${category} category at the ${eventYear} XR Awards! 🎉\n\nThis award represents our commitment to excellence and pushing the boundaries of extended reality technology.\n\nSee all winners: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`,
      `Incredible news! ${finalistName} has won the ${category} category at the ${eventYear} XR Awards! 🏆\n\nWe're deeply honored to receive this recognition from the XR community and grateful for everyone who has supported us on this journey.\n\nView all winners: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`,
      `We're delighted to announce that ${finalistName} is the ${category} winner at the ${eventYear} XR Awards! ✨\n\nThis recognition validates our team's hard work and dedication to creating innovative XR experiences.\n\nCheck out all winners: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`,
      `Amazing achievement! ${finalistName} has won the ${category} category at the ${eventYear} XR Awards! 🚀\n\nWe're grateful for this prestigious recognition and excited to continue pushing the boundaries of what's possible in XR.\n\nView all winners: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`
    ];
  }

  return [
    `Thrilled to announce that ${finalistName} has been selected as a finalist in the ${category} category for the ${eventYear} XR Awards! 🏆\n\nThis recognition means a lot to our team and we're excited to be part of the XR community.\n\nView all finalists and winners: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`,
    `We're incredibly proud to share that ${finalistName} has been chosen as a finalist in the ${category} category for the ${eventYear} XR Awards! 🎉\n\nThis achievement reflects our commitment to innovation in the XR space.\n\nSee all finalists: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`,
    `Exciting news! ${finalistName} has been selected as a finalist in the ${category} category for the ${eventYear} XR Awards! 🏆\n\nWe're honored to be recognized alongside such incredible talent in the XR industry.\n\nView all finalists and winners: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`,
    `We're delighted to announce that ${finalistName} is a finalist in the ${category} category for the ${eventYear} XR Awards! ✨\n\nThis recognition validates our team's hard work and dedication to pushing the boundaries of XR technology.\n\nCheck out all finalists: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`,
    `Amazing news! ${finalistName} has been chosen as a finalist in the ${category} category for the ${eventYear} XR Awards! 🚀\n\nWe're grateful for this recognition and excited to be part of the XR community's continued growth.\n\nView all finalists: ${winnersPageUrl}\n\n${hashtag} ${LINKEDIN_HANDLES}`
  ];
}

/**
 * Generate Instagram copy templates
 */
function getInstagramTemplates(config: SocialCopyConfig): string[] {
  const { finalistName, category, isWinner } = config;
  const eventYear = String(config.eventYear);
  const hashtag = `#XRAwards${eventYear.slice(-2)}`;
  const winnersPageUrl = `https://xrawards.aixr.org/winners-and-finalists-${eventYear}`;
  const extraHashtags = '#XR #VirtualReality #AugmentedReality #Innovation #Awards #Technology #ImmersiveTech #FutureTech #DigitalInnovation #TechAwards #VR #AR #MR #ExtendedReality #TechCommunity';

  if (isWinner) {
    return [
      `🏆 WE WON! 🏆\n\nWe're beyond thrilled to announce that ${finalistName} has won the ${category} category at the ${eventYear} XR Awards! 🎉\n\nThis is an incredible honor and we're so grateful to the amazing XR community! ✨\n\nCheck out all the winners: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`,
      `🎉 WINNER ANNOUNCEMENT! 🎉\n\n${finalistName} is officially the ${category} category winner at the ${eventYear} XR Awards! 🏆\n\nWe're overwhelmed with joy and grateful for this incredible recognition! 💫\n\nSee all the amazing winners: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`,
      `✨ WE DID IT! ✨\n\n${finalistName} has won the ${category} category at the ${eventYear} XR Awards! 🚀\n\nThis award means everything to our team! Thank you to the XR community for this incredible honor! 🙏\n\nView all winners: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`,
      `🎊 WINNER! 🎊\n\nWe're thrilled to announce that ${finalistName} is the winner of the ${category} category at the ${eventYear} XR Awards! 🏆\n\nThis is a dream come true! We're so honored to be recognized among the best in XR! ✨\n\nCheck out all winners: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`,
      `🚀 INCREDIBLE NEWS! 🚀\n\n${finalistName} has won the ${category} category at the ${eventYear} XR Awards! 🎉\n\nWe're over the moon with this achievement! Thank you to everyone who believed in us! 💫\n\nSee all the amazing winners: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`
    ];
  }

  return [
    `🎉 FINALIST ANNOUNCEMENT! 🎉\n\nWe're beyond excited to share that ${finalistName} has been selected as a finalist in the ${category} category for the ${eventYear} XR Awards! 🏆\n\nThis is such an honor and we can't wait to celebrate with the amazing XR community! ✨\n\nCheck out all the incredible finalists: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`,
    `🏆 WE DID IT! 🏆\n\n${finalistName} is officially a finalist in the ${category} category for the ${eventYear} XR Awards! 🎊\n\nWe're so proud of this achievement and grateful to be part of such an innovative community! 💫\n\nSee all the amazing finalists: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`,
    `✨ INCREDIBLE NEWS! ✨\n\n${finalistName} has been chosen as a finalist in the ${category} category for the ${eventYear} XR Awards! 🚀\n\nThis recognition means everything to our team! Thank you to the XR community for this amazing opportunity! 🙏\n\nView all finalists: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`,
    `🎊 CELEBRATION TIME! 🎊\n\nWe're thrilled to announce that ${finalistName} is a finalist in the ${category} category for the ${eventYear} XR Awards! 🏆\n\nThis is a dream come true! We're so excited to be part of this incredible journey! ✨\n\nCheck out all finalists: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`,
    `🚀 AMAZING ACHIEVEMENT! 🚀\n\n${finalistName} has been selected as a finalist in the ${category} category for the ${eventYear} XR Awards! 🎉\n\nWe're over the moon with this recognition! The XR community continues to inspire us every day! 💫\n\nSee all the incredible finalists: ${winnersPageUrl}\n\n${hashtag} ${INSTAGRAM_HANDLES} ${extraHashtags}`
  ];
}

/**
 * Generate press release template
 */
function generatePressRelease(config: SocialCopyConfig): string {
  const { 
    finalistName, 
    category, 
    organization = '', 
    description = '', 
    websiteUrl = '',
    eventName = 'XR Awards',
    isWinner = false
  } = config;
  const eventYear = String(config.eventYear || '2025');

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Clean description for press release
  const cleanDesc = description ? description.trim().replace(/\.$/, '') : '';

  // Status text based on winner/finalist
  const statusText = isWinner ? 'Winner' : 'Finalist';
  const statusTextLower = isWinner ? 'winner' : 'finalist';
  const selectionText = isWinner ? 'Wins' : 'Selected as Finalist for';
  const recognitionText = isWinner ? 'won' : 'been selected as a finalist in';

  // Quote templates - adapted for winner/finalist
  const quoteTemplates = isWinner ? [
    `"We are absolutely thrilled to win the ${eventYear} ${eventName} in the ${category} category," said [Insert name of a representative from ${organization || 'the project team'}]. "This award validates our commitment to pushing the boundaries of what's possible in extended reality technology."`,
    `"Winning the ${eventYear} ${eventName} is an incredible honor for our team," said [Insert name of a representative from ${organization || 'the project team'}]. "This achievement reflects our dedication to innovation and excellence in the XR space."`,
    `"We're incredibly proud to be recognized as the winner in the ${category} category," said [Insert name of a representative from ${organization || 'the project team'}]. "This recognition from the XR community means everything to our team."`,
    `"This win at the ${eventYear} ${eventName} represents years of hard work and innovation," said [Insert name of a representative from ${organization || 'the project team'}]. "We're honored to be recognized among such an incredible community of XR pioneers."`,
    `"Winning this award validates our vision for the future of extended reality," said [Insert name of a representative from ${organization || 'the project team'}]. "We're grateful to be recognized as the best in our category."`
  ] : [
    `"We are thrilled to be recognized as a finalist for the ${eventYear} ${eventName}," said [Insert name of a representative from ${organization || 'the project team'}]. "This recognition validates our commitment to pushing the boundaries of what's possible in extended reality technology."`,
    `"Being selected as a finalist for the ${eventYear} ${eventName} is a tremendous honor," said [Insert name of a representative from ${organization || 'the project team'}]. "This achievement reflects our dedication to innovation and excellence in the XR space."`,
    `"We're incredibly proud to be recognized as a finalist in the ${category} category," said [Insert name of a representative from ${organization || 'the project team'}]. "This recognition from the XR community means everything to our team."`,
    `"This finalist selection for the ${eventYear} ${eventName} represents years of hard work and innovation," said [Insert name of a representative from ${organization || 'the project team'}]. "We're excited to be part of such an incredible community of XR pioneers."`,
    `"Being chosen as a finalist validates our vision for the future of extended reality," said [Insert name of a representative from ${organization || 'the project team'}]. "We're honored to be recognized alongside the industry's most innovative projects."`
  ];

  const selectedQuote = quoteTemplates[Math.floor(Math.random() * quoteTemplates.length)];

  const closingParagraph = isWinner 
    ? `For more information about the awards, winners, and ceremony details, visit https://xrawards.aixr.org/winners-and-finalists-${eventYear}${websiteUrl ? ' or learn more about ' + finalistName + ' at ' + websiteUrl : ''}.`
    : `Winners will be announced during the ${eventName} ceremony. For more information about the awards, finalists, and ceremony details, visit https://xrawards.aixr.org/winners-and-finalists-${eventYear}${websiteUrl ? ' or learn more about ' + finalistName + ' at ' + websiteUrl : ''}.`;

  return `${finalistName} ${selectionText} ${eventYear} ${eventName} in ${category} Category

${organization ? organization + ' ' : ''}Recognized for ${isWinner ? 'Excellence' : 'Innovation'} in Extended Reality Technology

International - ${todayFormatted}: For immediate release

${finalistName}${organization ? ' by ' + organization : ''} has ${recognitionText} the ${category} category for the prestigious ${eventYear} ${eventName}. This recognition highlights the ${isWinner ? 'outstanding' : 'innovative'} work being done in the extended reality space and showcases the cutting-edge technology that is shaping the future of immersive experiences.

The ${eventName} celebrate outstanding achievements and innovation in virtual, augmented, and mixed reality across diverse sectors globally. Being ${isWinner ? 'awarded as a winner' : 'selected as a finalist'} represents recognition from industry experts and peers for exceptional work in the XR field.

${finalistName}${cleanDesc ? ' - ' + cleanDesc : ''} demonstrates the kind of innovative thinking and technical excellence that the ${eventName} were established to recognize. The project showcases the potential of extended reality technology to transform industries and create meaningful experiences for users.

${selectedQuote}

${closingParagraph}

Contact
For any press and media enquiries, please contact:

AIXR Press Team: awards@aixr.org
Stereopsia | United XR Europe: emma@stereopsia.com
${statusText} Press Contact: [${statusText} key contact]

Social media
Twitter: 
Instagram: 
LinkedIn:

About ${organization || finalistName}: [Insert Boilerplate copy]

Our boilerplate:

About AIXR - The Academy of International Extended Reality (AIXR) hosts the prestigious international AIXR XR Awards, established in 2017. The awards celebrate outstanding achievements and innovation in virtual, augmented, and mixed reality across diverse sectors globally. Recognized as a benchmark for excellence, the AIXR XR Awards aim to elevate groundbreaking work, honor industry leaders, and drive the immersive technology ecosystem forward. AIXR fosters a global community connecting professionals and innovators within the tech industry. Learn more at https://xrawards.aixr.org.

About United XR Europe - United XR Europe represents the strategic collaboration between AWE and Stereopsia, combining the strengths of AWE EU and Stereopsia into a unified platform. It is dedicated to fostering a global community and celebrating excellence in the immersive technology industry. Learn more at www.unitedxr.eu.`;
}

/**
 * Pick a random template from an array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate all social copy for a finalist
 */
export function generateSocialCopy(config: SocialCopyConfig): SocialCopyResult {
  return {
    twitter: pickRandom(getTwitterTemplates(config)),
    linkedin: pickRandom(getLinkedInTemplates(config)),
    instagram: pickRandom(getInstagramTemplates(config)),
    pressRelease: generatePressRelease(config)
  };
}

/**
 * Generate share URL for social platforms
 */
export function getShareUrl(platform: 'twitter' | 'linkedin', config: SocialCopyConfig): string {
  const { finalistName, category, isWinner } = config;
  const eventYear = String(config.eventYear);
  const winnersPageUrl = `https://xrawards.aixr.org/winners-and-finalists-${eventYear}/`;

  switch (platform) {
    case 'twitter': {
      const shareText = isWinner
        ? `🏆 Thrilled to announce we won the ${category} category at the ${eventYear} XR Awards! #XRAwards${eventYear.slice(-2)} @vrawards @aixrorg`
        : `🎉 Excited to be a finalist in the ${category} category at the ${eventYear} XR Awards! #XRAwards${eventYear.slice(-2)} @vrawards @aixrorg`;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(winnersPageUrl)}`;
    }
    case 'linkedin': {
      const shareText = isWinner
        ? `🏆 We are thrilled to announce that ${finalistName} has won the ${category} category at the ${eventYear} XR Awards!`
        : `Thrilled to announce that ${finalistName} has been selected as a finalist in the ${category} category for the ${eventYear} XR Awards! 🏆`;
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(winnersPageUrl)}&summary=${encodeURIComponent(shareText)}`;
    }
    default:
      return '';
  }
}

/**
 * Generate Instagram share text (for clipboard copy)
 */
export function getInstagramShareText(config: SocialCopyConfig): string {
  const { finalistName, category, isWinner } = config;
  const eventYear = String(config.eventYear);
  const winnersPageUrl = `https://xrawards.aixr.org/winners-and-finalists-${eventYear}/`;
  
  if (isWinner) {
    return `🏆 WE WON! 🏆\n\nWe're beyond thrilled to announce that ${finalistName} has won the ${category} category at the ${eventYear} XR Awards! 🎉\n\nThis is an incredible honor and we're so grateful to the amazing XR community! ✨\n\nCheck out all the winners: ${winnersPageUrl}\n\n#XRAwards${eventYear.slice(-2)} @vrawards @unitedxr @aixrorg #XR #VirtualReality #AugmentedReality #Innovation #Awards #Technology #ImmersiveTech #FutureTech #DigitalInnovation #TechAwards #VR #AR #MR #ExtendedReality #TechCommunity`;
  }
  
  return `🎉 FINALIST ANNOUNCEMENT! 🎉\n\nWe're beyond excited to share that ${finalistName} has been selected as a finalist in the ${category} category for the ${eventYear} XR Awards! 🏆\n\nThis is such an honor and we can't wait to celebrate with the amazing XR community! ✨\n\nCheck out all the incredible finalists: ${winnersPageUrl}\n\n#XRAwards${eventYear.slice(-2)} @vrawards @unitedxr @aixrorg #XR #VirtualReality #AugmentedReality #Innovation #Awards #Technology #ImmersiveTech #FutureTech #DigitalInnovation #TechAwards #VR #AR #MR #ExtendedReality #TechCommunity`;
}

