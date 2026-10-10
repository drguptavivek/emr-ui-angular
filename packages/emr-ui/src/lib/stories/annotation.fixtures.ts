import type { EmrClinicalImageTemplate } from '@drguptavivek/emr-controller';

const dataUriFromSvg = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/**
 * Placeholder outline sketches for stories only — not clinically reviewed anatomy.
 * Reviewed, versioned anatomy assets arrive as L5 recipes (drawing plan, Phase 2).
 * width/height match each SVG's intrinsic size.
 */
export const placeholderAnatomyTemplates: readonly EmrClinicalImageTemplate[] = [
  {
    id: 'abdominal-outline',
    label: 'Abdominal outline',
    altText: 'Abdominal anatomy outline',
    width: 1600,
    height: 1000,
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000' viewBox='0 0 1600 1000'><rect width='1600' height='1000' fill='#f8fafc'/><path d='M460 145 C420 210 400 290 430 360 C470 440 505 520 510 610 C510 720 560 760 620 840 C670 900 750 900 810 840 C880 760 920 720 920 610 C925 520 960 440 1000 360 C1030 290 1010 210 970 145 L830 170 L740 90 L620 150 L500 90 L460 145 Z' fill='none' stroke='#94a3b8' stroke-width='12'/><circle cx='700' cy='930' r='110' fill='none' stroke='#94a3b8' stroke-width='12'/></svg>`)
  },
  {
    id: 'limb-outline',
    label: 'Limb outline',
    altText: 'Limb anatomy outline',
    width: 1200,
    height: 1200,
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200' viewBox='0 0 1200 1200'><rect width='1200' height='1200' fill='#f8fafc'/><path d='M600 40 L560 190 L540 270 L525 360 L610 620 L660 790 C665 815 675 845 690 870 L730 925 C745 950 760 980 760 1010 C760 1050 740 1090 700 1115 L760 1180 M600 40 L660 190 L680 270 L695 360 L690 620 L640 790 C635 815 625 845 610 870 L570 925 C555 950 540 980 540 1010 C540 1050 560 1090 600 1115 L540 1180 M600 620 L600 760 M580 760 L620 760 C640 760 660 790 650 815 L620 855 C603 870 580 875 560 865 L535 850 C515 840 500 815 510 780 L520 760 L580 760' fill='none' stroke='#94a3b8' stroke-width='10'/><path d='M520 760 L455 830 C445 840 430 835 435 820 L455 785 C465 760 470 740 450 735 C430 730 430 705 450 700 L585 665 C595 663 600 640 585 635 L455 560 C440 553 442 530 460 530 L580 530 C595 530 600 515 595 505 L560 430 C553 415 572 400 588 408 L655 450 C670 458 690 445 690 430 L690 360 C690 345 705 332 720 338 L770 355' fill='none' stroke='#94a3b8' stroke-width='8'/></svg>`)
  },
  {
    id: 'scalp-outline',
    label: 'Scalp outline',
    altText: 'Scalp anatomy outline',
    width: 1200,
    height: 900,
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'><rect width='1200' height='900' fill='#f8fafc'/><path d='M360 300 C480 110 720 110 840 300 C920 420 930 610 820 700 C700 790 500 790 380 700 C270 610 280 420 360 300 Z' fill='none' stroke='#94a3b8' stroke-width='12'/><path d='M390 340 C495 225 705 225 810 340' fill='none' stroke='#94a3b8' stroke-width='6'/><path d='M420 430 C510 455 690 455 780 430' fill='none' stroke='#94a3b8' stroke-width='6'/><path d='M430 520 C525 545 675 545 770 520' fill='none' stroke='#94a3b8' stroke-width='6'/><line x1='460' y1='250' x2='740' y2='250' stroke='#94a3b8' stroke-width='4'/></svg>`)
  },
  {
    id: 'body-outline',
    label: 'Whole body outline',
    altText: 'Human body outline',
    width: 1200,
    height: 1400,
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1400' viewBox='0 0 1200 1400'><rect width='1200' height='1400' fill='#f8fafc'/><ellipse cx='600' cy='220' rx='115' ry='130' fill='none' stroke='#94a3b8' stroke-width='10'/><path d='M480 320 L430 530 L430 840 C420 920 370 1060 320 1120 C300 1150 250 1185 280 1220 C300 1240 325 1230 360 1215 C430 1180 520 1130 600 1130 C680 1130 770 1180 840 1215 C875 1230 900 1240 920 1220 C950 1185 900 1150 880 1120 C830 1060 780 920 770 840 L770 530 L720 320 C720 220 610 140 600 150 C590 140 480 220 480 320 Z' fill='none' stroke='#94a3b8' stroke-width='12'/><path d='M600 150 C575 70 635 70 610 150' fill='none' stroke='#94a3b8' stroke-width='10'/></svg>`)
  },
  {
    id: 'retina-od',
    label: 'Retina OD',
    altText: 'Right eye retina schematic',
    width: 1000,
    height: 900,
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='900' viewBox='0 0 1000 900'><rect width='1000' height='900' fill='#f8fafc'/><circle cx='500' cy='420' r='250' fill='none' stroke='#94a3b8' stroke-width='10'/><circle cx='500' cy='420' r='30' fill='none' stroke='#94a3b8' stroke-width='10'/><circle cx='300' cy='420' r='24' fill='none' stroke='#94a3b8' stroke-width='8'/><circle cx='700' cy='420' r='24' fill='none' stroke='#94a3b8' stroke-width='8'/><path d='M500 180 C620 190 700 300 720 420 C700 540 620 650 500 660 C380 650 300 540 280 420 C300 300 380 190 500 180' fill='none' stroke='#94a3b8' stroke-width='8'/></svg>`)
  },
  {
    id: 'retina-os',
    label: 'Retina OS',
    altText: 'Left eye retina schematic',
    width: 1000,
    height: 900,
    imageUrl: dataUriFromSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='900' viewBox='0 0 1000 900'><rect width='1000' height='900' fill='#f8fafc'/><circle cx='500' cy='420' r='250' fill='none' stroke='#94a3b8' stroke-width='10'/><circle cx='500' cy='420' r='30' fill='none' stroke='#94a3b8' stroke-width='10'/><circle cx='300' cy='420' r='24' fill='none' stroke='#94a3b8' stroke-width='8'/><circle cx='700' cy='420' r='24' fill='none' stroke='#94a3b8' stroke-width='8'/><path d='M500 180 C380 190 300 300 280 420 C300 540 380 650 500 660 C620 650 700 540 720 420 C700 300 620 190 500 180' fill='none' stroke='#94a3b8' stroke-width='8'/></svg>`)
  },
];
