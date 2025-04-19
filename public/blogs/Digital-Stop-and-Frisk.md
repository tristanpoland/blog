---
title: "The Digital Stop and Frisk: When Your Privacy Meets Border Control"
date: "2025-04-18"
categories: ["Security", "Privacy", "Device Protection", "Government Overreach"]
tags: ["Encryption", "Border Security", "Digital Rights"]
readingTime: "30 min"
---

## Introduction

I've been thinking a lot about device security lately. With increased border searches and the ease with which both government agencies and random hackers can access our digital lives, understanding how to protect your devices isn't just for the tech-savvy anymore. It's becoming essential knowledge for everyone from activists to your grandparents who just want to maintain some basic privacy.

Before we dive in, I want to make it clear that this article is not about politics or any specific politician. My intention is purely to present the technical realities we face in today's digital landscape. The focus here is on practical steps you can take to safeguard your privacy and security against overreach by a government, regardless of your personal or political affiliations.[^1]

## The Three States of Your Device: Cold, Warm, and Hot

Think of your device's security level like temperature. Each state represents a different level of vulnerability, and knowing when to use each one is crucial for protecting your information.

A device in a "cold state" is completely powered off—not sleep mode, not hibernation, but fully shut down. This is your most secure state because the encryption keys aren't loaded into memory, making your data hardest to access. Security expert Bruce Schneier recommends using this state when crossing borders, in high-risk situations, or when leaving devices unattended for extended periods.[^2]

The "warm state" occurs when your device is sleeping or hibernating. Some security keys may remain in memory, creating more vulnerability than a cold state but still maintaining reasonable security for everyday situations. This is appropriate for coffee shops or other public places when you'll return to your device shortly.

A "hot state" means your device is fully powered on, whether unlocked or recently locked. All encryption keys are loaded in memory, presenting the maximum attack surface to potential intruders. Only keep your device in this state while actively using it, and never leave it unattended.

## Encryption: Your Digital Safe

Encryption transforms your data into unreadable gibberish that only becomes readable with the right key (your password). Without encryption, anyone with physical access to your device can easily view all your files. According to the Electronic Frontier Foundation, enabling full-disk encryption is "the single most important step you can take to protect the data on your devices."[^3]

To properly implement encryption, enable full-disk encryption on all your devices. On Windows, use BitLocker (available in Pro or Enterprise editions); on Mac, enable FileVault; on Linux, use LUKS (typically available during installation); and on phones, ensure device encryption is enabled (usually on by default when you set a passcode).

Use strong passwords or passphrases—at least 12 characters long. Contrary to popular belief, a string of random words (like "correct-horse-battery-staple") is actually stronger than a shorter, complex password like "P@55w0rd!" because it contains more total characters while remaining memorable.

If you use an Apple device with M-series chips, be aware of a vulnerability reported by Bloomberg Technology in October 2024. These chips may not be fully secure when powered off, making them potentially vulnerable to specialized attacks. This is primarily a concern for high-risk individuals like journalists and activists, who should consider using extremely strong passwords and third-party encryption solutions.[^4]

## Secure Boot: The Bouncer at Your Device's Door

Secure boot prevents malicious software from loading when your device starts up. Microsoft describes it as a security feature that "helps prevent unauthorized operating systems and software from loading during the startup process."[^5] Think of it as a bouncer checking IDs before allowing programs to run.

You can check if secure boot is enabled on Windows by pressing Win+R, typing "msinfo32", and checking the "Secure Boot State" value. On Macs with T2 chips or Apple Silicon, it's enabled by default. Linux users can check by opening Terminal and typing "mokutil --sb-state". On smartphones, secure boot is enabled by default and cannot be disabled.

## Phone Cracking Hardware: Understanding the Threat by Device State

When discussing device security at borders and in high-risk situations, it's important to understand the actual capabilities of the phone cracking hardware that might be used against your devices. Here's an overview of the current landscape and how your device's state affects its vulnerability.

### The Major Players

The mobile forensics market is dominated by a few key companies that sell their hardware primarily to law enforcement agencies, though their reach has expanded considerably in recent years:

1. **Cellebrite**: An Israeli company that produces the Universal Forensic Extraction Device (UFED) and Cellebrite Premium tools used by thousands of government agencies worldwide.

2. **Grayshift**: An American company that produces GrayKey, a device specifically designed to crack iPhone passcodes. According to Wikipedia, as of March 2024, GrayKey has "full support" for iOS 17 devices, Samsung's Galaxy S24 smartphones, and Google's Pixel 6 and Pixel 7 devices.[^12]

3. **Magnet Forensics**: A Canadian firm that merged with Grayshift in 2023, combining their capabilities to create more comprehensive phone cracking solutions.

### Vulnerability by Device State

Your device's vulnerability to these cracking tools varies dramatically depending on what state it's in when seized:

#### Cold State (Powered Off)
- **Most Secure**: When completely powered off, your device's encryption keys aren't loaded into memory.
- **Modern iPhones (iOS 14+)**: Generally very difficult to access when powered off, though agencies like Cellebrite regularly claim breakthroughs.
- **Android Devices**: High-end Android phones (especially those from Samsung with Knox security) can be quite resistant to cracking when powered off.
- **Time Factor**: Cracking attempts on cold devices can take days or weeks, depending on passcode complexity.

#### Warm State (Sleep/Hibernation)
- **Moderately Vulnerable**: Some encryption keys remain in memory, potentially accessible.
- **iOS Devices**: Devices in sleep mode may be vulnerable to specialized attacks that can capture encryption keys from memory.
- **Android Devices**: Vulnerability varies greatly by manufacturer and Android version.
- **Time Factor**: Cracking attempts typically take hours to days.

#### Hot State (Powered On/Recently Unlocked)
- **Highly Vulnerable**: All encryption keys are in active memory.
- **Any Device**: If seized while unlocked or shortly after locking, most commercial cracking tools can extract significant data.
- **Time Factor**: Data extraction can often be performed in minutes to hours.

### The Arms Race Reality

The mobile security landscape is constantly evolving. According to cybersecurity experts, there's an ongoing cat-and-mouse game between device manufacturers and forensic companies.[^13] Apple and Google regularly patch vulnerabilities that these tools exploit, while Cellebrite and Grayshift work to find new ones.

Despite the marketing claims made by these companies, their actual capabilities are often exaggerated. As one expert noted on Quora, these companies "charge upfront for the attempt" and "keep mentioning that one time or two it worked in a high-profile case on a much older phone."[^14]

### Protection Strategies

1. **Use Strong Passcodes**: Six-digit numeric codes can be brute-forced relatively quickly. Use complex alphanumeric passcodes with 10+ characters.

2. **Enable "Erase Data" Option**: On iPhones, enable the setting that erases all data after 10 failed passcode attempts.

3. **Keep Devices Updated**: Always install the latest security updates, which often patch vulnerabilities exploited by cracking tools.

4. **Power Off Before Risk**: Before crossing borders or entering high-risk situations, power your device completely off (cold state) rather than just locking it.

5. **Use Travel Devices**: For maximum security, use a separate, minimal "burner" device when traveling that contains only essential data.

## Five Essential Security Steps for Everyone

Based on security expert recommendations and lessons from cases like Makled's, here are five critical steps everyone should take:

1. **Keep devices in cold state when not in use** (especially when crossing borders)
2. **Use strong, unique passwords** for all accounts (consider a password manager)
3. **Enable two-factor authentication** on important accounts (preferably using an authenticator app, not SMS)
4. **Update your software regularly** (security patches are crucial)
5. **Be aware of your surroundings** in public places (use privacy screens)

## Border Crossings: The Makled Case Study

Border crossings represent a peculiar legal gray zone where normal constitutional protections are weakened. The recent case of attorney Amir Makled offers a troubling glimpse into how border searches can be used to target individuals for their political associations or professional work.

In April 2025, Amir Makled, a civil rights attorney from Dearborn, Michigan, was returning from a family vacation in the Dominican Republic with his wife and twin 9-year-old daughters when he was detained at Detroit Metro Airport. As reported by multiple news sources, Makled, who was born in Detroit and is a U.S. citizen, specializes in civil rights, personal injury, and criminal defense work and had recently taken on a case representing a student protester arrested during pro-Palestinian demonstrations at the University of Michigan.[^7]

The trouble began at passport control. According to Democracy Now!, "As Makled approached the desk, he heard the agent ask if there was a 'TTRT agent' available. After Googling the acronym, he discovered it stood for 'Tactical Terrorism Response Team,' and he was immediately directed to a secondary screening room."[^6]

The Washington Post reported that the "plainclothes immigration officer who questioned Makled made it clear they knew who he was, telling him: 'We know that you're an attorney and we know that you're taking on some higher-profile cases.'" The officers then demanded access to his phone.[^11]

When Makled refused, citing attorney-client privilege, Reason magazine reported that "the agents told him they would either take his device completely or he could allow them to search it."[^3] After consulting with a supervisor, the agent returned and said they planned to confiscate the phone unless Makled provided his contact list. Scheerpost noted that "Eventually, after a 90-minute standoff, Makled agreed to let them view only his contacts list, but refused to identify which contacts were clients."[^8]

What makes this case particularly troubling is that at U.S. borders, officials can conduct warrantless searches without probable cause or reasonable suspicion. Democracy Now! quoted Makled explaining: "They do not require a warrant. They can have a warrantless search, without probable cause, without any reasonable suspicion. The statute at the border gives a wide range of authority for government to seize devices."[^6] This "border search exception" to the Fourth Amendment creates a situation where even U.S. citizens with professional confidentiality obligations can have their devices searched.

According to Reason, "CBP seemed to be waiting for Makled when he got back," and appeared specifically interested in his role as an attorney representing protesters. This suggests that rather than being a random security check, the search may have been targeted due to Makled's legal work.[^3]

This incident raises serious concerns about how border searches can be weaponized against attorneys and others engaged in constitutionally protected activities. The New Republic quoted Makled saying: "This current administration is doing something that no administration has done—they are attacking attorneys."[^10]

After being released, Makled spoke out about his experience, appearing on national news programs and giving interviews to raise awareness about border search exceptions. HuffPost reported that far from intimidating him, Makled said the incident has had "the opposite effect" and that he's received "an outpouring of support" from attorneys across the country who are "offended by this type of conduct."[^6]

His advice to travelers concerned about privacy at borders is blunt. Scheerpost quoted him saying: "Don't unlock your phones. If you're coming through the border, keep your phone off. And if an agent does request a secondary screening and your phone is subject to a search, you can keep your phone turned off. You don't have to give them your password."[^8]

## Data Compartmentalization: Don't Keep All Eggs in One Basket

Separating your digital life across different devices or accounts limits the damage if any single system is compromised. The Guardian's reporting on the Makled case highlighted the importance of this approach for anyone concerned about privacy.[^8]

Keep work data on work devices, use a minimal "burner" device for travel, store sensitive documents on encrypted external drives, and use different accounts for different purposes. This approach ensures that if one device is compromised, your entire digital life isn't exposed.

When it comes to protecting yourself at borders specifically, Makled advises in his Democracy Now! interview to "take a different device without all of your data on your phone. You'd have to almost travel with a burner phone, for lack of a better word."[^8] Power down completely before approaching customs, as a cold device is significantly harder to access than one that's just locked.

Back up and securely wipe sensitive data before travel, then restore after crossing. Consider cloud-based access instead of local storage by uploading necessary files to encrypted cloud storage that you can access after crossing. Finally, understand the potential consequences of refusal—officials can seize your device, detain you for extended periods, or deny entry if you're not a citizen.

## Network Security: The Truth About VPNs

When it comes to online privacy, VPNs (Virtual Private Networks) are often touted as a security silver bullet, but the reality is more nuanced. As I detailed in my analysis "VPNs Won't Save Us," most commercial VPN marketing claims significantly overstate their security benefits.[^9]

VPNs create an encrypted tunnel between your device and a VPN server. However, it's crucial to understand that for most web browsing, HTTPS already provides encryption between your device and the websites you visit. As I explained in my December 2024 analysis, "VPNs and HTTPS use the same fundamental encryption technology - typically TLS (Transport Layer Security)."[^9]

What VPNs actually do is hide your browsing activity from your local network administrator (like a coffee shop WiFi or hotel) and your Internet Service Provider. They don't add meaningful security for activities that already use HTTPS encryption, such as banking or email. When accessing your bank account on public WiFi, HTTPS already prevents anyone from intercepting your credentials or account details—the VPN merely hides which bank you're visiting.

Perhaps more concerning is that VPNs create what I call "a single point of surveillance" by routing all your traffic through one provider. As I wrote, "While VPNs claim to protect privacy, routing all traffic through a single provider actually creates a perfect bottleneck for mass surveillance."[^9] This concentration of data makes VPN providers attractive targets for government agencies or criminal actors.

VPNs do have legitimate uses. They're essential for accessing internal company resources when working remotely, and they can be useful when traveling in countries with extensive internet censorship or surveillance. However, for everyday privacy concerns, properly implemented HTTPS and good security practices often provide better protection than relying on a VPN's "no logs" policy.

When using public WiFi, focus on ensuring the sites you visit use HTTPS (look for the padlock icon in your browser), keep your operating system and browser updated, and be cautious about which networks you join. These practices will typically provide better security than a commercial VPN.

## The Balance: Security vs. Convenience

Perfect security doesn't exist – the goal is making your data difficult enough to access that adversaries give up or move to easier targets, as security researcher Jonathan Zdziarski explains in "Protecting Your Digital Privacy: A Practical Guide."[^10]

My balanced approach includes: strong encryption on all devices, cold state for borders and high-risk situations, warm state for everyday use, a password manager for unique, strong passwords, two-factor authentication for important accounts, regular software updates, and basic awareness of surroundings.

## Conclusion

The digital world in 2025 requires everyone to develop basic security literacy. It's not about being paranoid – it's about taking reasonable precautions to protect your private information from both government overreach and malicious actors.

Situations like what happened to Amir Makled remind us that the "I have nothing to hide" argument misses the point. Privacy isn't about hiding wrongdoing—it's about maintaining basic dignity and autonomy in an increasingly surveilled world, as the Washington Post's reporting on his case makes clear.[^11]

These measures won't make you completely immune to surveillance, but they create significant barriers that deter all but the most determined and well-resourced adversaries. Find the balance that works for you between security and convenience, but don't ignore these basics – the cost of a security failure has never been higher.

What about you? Have you taken steps to secure your devices, or is this all new territory? We should be acting yesterday to keep our privacy intact, but the best you can do right now is to act today before you too are subject to an unpermitted device search, or a stolen device.

[^1]: Electronic Frontier Foundation. "Digital Security Tips for Travelers." [https://www.eff.org/issues/travel-screening](https://www.eff.org/issues/travel-screening)

[^2]: Schneier, Bruce. "Data and Goliath: The Hidden Battles to Collect Your Data and Control Your World." W.W. Norton & Company, 2015.

[^3]: Reason. "Border cops try to make an end run around attorney-client privilege." April 8, 2025. [https://reason.com/2025/04/08/border-cops-try-to-make-an-end-run-around-attorney-client-privilege/](https://reason.com/2025/04/08/border-cops-try-to-make-an-end-run-around-attorney-client-privilege/)

[^4]: Gallagher, Ryan. "Researchers Find Vulnerability in Apple M1 Chip That Can't Be Patched." Bloomberg Technology, October 2024.

[^5]: Microsoft. "Secure Boot Overview." [https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/oem-secure-boot](https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/oem-secure-boot)

[^6]: Democracy Now!. "Michigan Lawyer Detained at Detroit Airport, Phone Seized; He Represents Pro-Palestine Protester." April 11, 2025. [https://www.democracynow.org/2025/4/11/lawyer_detained_border](https://www.democracynow.org/2025/4/11/lawyer_detained_border)

[^7]: Hall Makled Law. "Amir Makled - Partner/Principal." [https://www.hallmakled.com/attornies-bio/amir-makled](https://www.hallmakled.com/attornies-bio/amir-makled)

[^8]: Scheerpost. "Michigan Lawyer Detained at Detroit Airport, Phone Seized; He Represents Pro-Palestine Protester." April 12, 2025. [https://scheerpost.com/2025/04/12/michigan-lawyer-detained-at-detroit-airport-phone-seized-he-represents-pro-palestine-protester/](https://scheerpost.com/2025/04/12/michigan-lawyer-detained-at-detroit-airport-phone-seized-he-represents-pro-palestine-protester/)

[^9]: Poland, Tristan. "VPNs: When will they save us, and when won't they?" Personal blog, December 24, 2024. [https://tridentforu.com/blog/posts/VPNs-wont-save-us](https://tridentforu.com/blog/posts/VPNs-wont-save-us)

[^10]: The New Republic. "Lawyer Representing Student Protester Detained by Immigration Agents." April 2025. [https://newrepublic.com/post/193742/immigration-agents-detain-lawyer-student-protester-palestine](https://newrepublic.com/post/193742/immigration-agents-detain-lawyer-student-protester-palestine)

[^11]: Washington Post. "Border agents ask lawyer with pro-Palestinian client to give up phone." April 8, 2025. [https://www.washingtonpost.com/nation/2025/04/08/michigan-lawyer-border-phone/](https://www.washingtonpost.com/nation/2025/04/08/michigan-lawyer-border-phone/)

[^12]: "Grayshift." Wikipedia, March 16, 2025. [https://en.wikipedia.org/wiki/Grayshift](https://en.wikipedia.org/wiki/Grayshift)

[^13]: Vice. "Government Report Reveals Its Favorite Way to Hack iPhones, Without Backdoors." July 27, 2024. [https://www.vice.com/en/article/government-report-reveals-its-favorite-way-to-hack-iphones-without-backdoors/](https://www.vice.com/en/article/government-report-reveals-its-favorite-way-to-hack-iphones-without-backdoors/)

[^14]: "Why do companies like Cellebrite and Graykey keep claiming they can crack into a locked iPhone or do the iPhone forensic when they can't?" Quora. [https://www.quora.com/Why-do-companies-like-Cellebrite-and-Graykey-keep-claiming-they-can-crack-into-a-locked-iPhone-or-do-the-iPhone-forensic-when-they-can-t](https://www.quora.com/Why-do-companies-like-Cellebrite-and-Graykey-keep-claiming-they-can-crack-into-a-locked-iPhone-or-do-the-iPhone-forensic-when-they-can-t)