---
title: "Graphite and Pegasus; No privacy is not dead"
date: "2025-9-5"
categories: ["Security", "Privacy", "Device Protection", "Government Overreach"]
tags: ["Encryption", "Surveillance", "Digital Rights", "Spyware"]
---

# Mobile Spyware Reality Check: What Pegasus and Graphite Actually Do (And Don't Do)

If you've spent any time on TikTok or Instagram lately, you've probably seen those viral videos with dramatic titles like "YOUR PHONE IS BEING WATCHED RIGHT NOW" or "How to tell if Pegasus spyware is on your phone." These videos rack up millions of views by spreading fear about sophisticated spyware tools like NSO Group's Pegasus and Paragon Solutions' Graphite. But here's the thing: most of what they're telling you is complete nonsense.

As someone who's spent years analyzing cybersecurity threats and digging through technical reports from organizations like [Citizen Lab](https://citizenlab.ca) and [Amnesty International](https://www.amnesty.org), I can tell you that the reality of these spyware tools is far more nuanced than viral social media content suggests. Yes, Pegasus and Graphite are real threats—but they're not the universal surveillance weapons that TikTok creators would have you believe.

**The bottom line**: These are expensive, government-exclusive tools designed for targeted political surveillance, not mass-market cyber weapons available to random criminals or your ex trying to spy on your Instagram DMs.

## The TikTok Terror Machine: How Social Media Spreads Spyware Panic

Let's start by addressing the elephant in the room: the absolute avalanche of misinformation about mobile spyware that floods social media every day. I've watched countless TikTok videos with creators dramatically whispering about how "THEY" are watching your every move, often accompanied by ominous music and quick cuts between stock footage of hooded hackers.

These videos typically follow a predictable formula: Start with a shocking claim ("Your phone is infected with Pegasus spyware RIGHT NOW"), show some grainy screenshots of technical-looking interfaces, list completely normal phone behaviors as "signs of infection" (battery drain, anyone?), and end with either a call to follow for "more cybersecurity tips" or a link to some sketchy "phone cleaning" app.

The problem isn't just that this content is wrong—it's that it fundamentally misrepresents how sophisticated spyware actually works. When a TikTok creator tells you that your phone heating up means you've been targeted by a $650,000 government surveillance tool, they're either completely ignorant about cybersecurity or deliberately spreading fear for views and engagement.

Instagram isn't much better. I've seen posts claiming that simply watching a certain type of video can install Pegasus, or that taking a screenshot of your phone's battery usage can somehow reveal spyware infection. These posts often get thousands of shares from well-meaning people who want to warn their friends, creating a viral cycle of misinformation.

**Here's what these social media "experts" consistently get wrong:**

They treat sophisticated government spyware like common malware that randomly infects phones. They confuse normal phone performance issues with signs of advanced persistent threats. They completely misunderstand the economics and targeting patterns of these tools. And worst of all, they prey on people's legitimate privacy concerns to build their own followings.

## The Technical Reality Behind Zero-Click Exploits

Now let's talk about what Pegasus and Graphite actually are, because understanding the real technology helps you separate fact from TikTok fiction.

Commercial spyware has evolved far beyond the crude malware of the early internet. Pegasus and Graphite represent state-of-the-art surveillance technology that exploits fundamental aspects of how mobile operating systems process data. But their sophistication comes with significant constraints that social media fear-mongers consistently ignore.

Zero-click exploits work by targeting vulnerabilities in automatic content processing—the way your phone handles incoming messages, renders images, or processes media files without your direct interaction. When [Citizen Lab researchers documented Pegasus exploiting CVE-2023-41064](https://citizenlab.ca/2023/09/blastpass-nso-group-iphone-zero-click-zero-day-exploit-captured-in-the-wild/), they found it attacked iOS's image processing library through specially crafted image files sent via iMessage.

The exploit chain required three separate vulnerabilities: first compromising the browser, then bypassing security protections, finally gaining kernel-level access to install the spyware payload. This isn't some script kiddie operation—this is nation-state level technical sophistication that costs millions to develop and deploy.

Graphite operates similarly but with different targeting mechanisms. The recently patched CVE-2025-43200 allowed zero-click exploitation through iCloud Link processing, where malicious content could trigger code execution when iOS automatically generated link previews. [Citizen Lab's forensic analysis](https://citizenlab.ca/2025/06/first-forensic-confirmation-of-paragons-ios-mercenary-spyware-finds-journalists-targeted/) of infected devices showed this attack vector successfully compromised fully updated iPhones running iOS 18.2.1 in early 2025.

**The crucial technical limitation that TikTok videos never mention**: These exploits depend entirely on unpatched vulnerabilities. Apple's iOS 18.3.1 update specifically addressed the Graphite zero-click attack, rendering that particular infection method ineffective. This cat-and-mouse dynamic between exploit development and security patches represents the fundamental constraint on these weapons—they're only as good as their most recent zero-day vulnerabilities.

When Apple patches a vulnerability, spyware operators need to find new attack vectors, which can take months or years to develop. This is why legitimate cybersecurity experts emphasize keeping your devices updated—not because updates magically protect against all threats, but because they close the specific technical vulnerabilities that these expensive tools exploit.

## How iOS and Android Actually Defend Against Sophisticated Spyware

Unlike what you might see in breathless Instagram posts about "turning off this one setting to stop hackers," mobile operating system security involves sophisticated, multi-layered defense systems specifically designed to counter threats like Pegasus and Graphite.

Apple's introduction of [Lockdown Mode](https://support.apple.com/en-us/105120) in iOS 16 represents the most significant consumer-facing anti-spyware innovation in mobile security history. This feature was designed explicitly to counter mercenary surveillance tools, and it works by dramatically reducing the attack surface available to sophisticated spyware.

iOS employs a multi-layered defense architecture that makes spyware deployment expensive and complex. The Secure Enclave handles biometric data and encryption keys in hardware isolated from the main processor. Code signing requirements mean all executables must be cryptographically verified, while app sandboxing prevents unauthorized system access.

Most significantly, the BlastDoor system introduced specifically for Messages creates a sandboxed environment for processing attachments, directly countering the message-based attack vectors that Pegasus frequently exploited. This isn't some marketing gimmick—it's a technical countermeasure born from real-world spyware analysis.

Android's security model relies on different technical approaches but achieves similar protective effects. [Google Play Protect](https://developers.google.com/android/play-protect) scans over 200 billion apps daily using machine learning algorithms to detect spyware behavior patterns. The Android sandbox assigns each app a unique user ID and uses Linux file permissions to prevent cross-app data access, while Verified Boot cryptographically confirms system integrity from bootloader to applications.

Government responses demonstrate the seriousness of these threats. Apple has sent [threat notifications to users in over 150 countries](https://support.apple.com/en-us/102174) since 2021, warning of potential mercenary spyware attacks. The company also sued NSO Group directly and established a $10 million fund specifically for cybersecurity research and advocacy.

**The security updates tell the real story**. Apple released emergency patches for Pegasus vulnerabilities (iOS 9.3.5 in 2016, iOS 14.8 in 2021, and multiple 2022 updates), while Google provides monthly security bulletins addressing spyware-exploitable vulnerabilities. These rapid response cycles demonstrate both the ongoing threat and the effectiveness of platform-level defenses.

This is why cybersecurity professionals roll their eyes when they see TikTok videos claiming you need to download some random app to "protect yourself from Pegasus." The protection is already built into your phone's operating system—you just need to keep it updated.

## Targeting Patterns Reveal Political Surveillance, Not Random Attacks

Here's where the TikTok fear machine really falls apart: the actual data about who gets targeted by these tools completely contradicts claims of universal threat.

Citizen Lab's analysis of Pegasus infrastructure identified 1,091 IP addresses and 1,014 domain names across 36 distinct operator systems, representing separate government clients rather than widespread criminal use. The leaked [Pegasus Project data](https://www.amnesty.org/en/latest/press-release/2021/07/the-pegasus-project/) contained approximately 50,000 phone numbers globally—a large absolute number but representing 0.001% of the world's mobile phone users.

Let me put that in perspective: You're more likely to be struck by lightning twice than to be randomly targeted by Pegasus spyware.

Forensic analysis reveals clear targeting categories that demolish myths about random civilian surveillance. Of documented Pegasus targets, journalists account for roughly 180 confirmed cases across 20 countries, while human rights defenders, political opposition figures, and civil society workers comprise the vast majority of verified infections.

The cost structure explains this selectivity: NSO Group charged $650,000 plus a $500,000 setup fee for just 10 device licenses, making mass deployment economically impossible. This isn't some app you can download from a sketchy website—this is million-dollar government surveillance infrastructure.

**Geographic analysis shows clear political correlation**. Operations concentrate in countries with declining press freedom scores, with confirmed NSO clients including Azerbaijan, Bahrain, Hungary, India, Mexico, Morocco, Rwanda, and Saudi Arabia. Cross-border targeting occurs frequently—at least 10 Pegasus operators engage in extraterritorial surveillance, often targeting opposition figures, journalists, or dissidents living abroad.

The Graphite deployment pattern follows similar selectivity. Citizen Lab's forensic confirmation of infections targeting Ciro Pellegrino (Fanpage.it journalist) and a prominent European reporter demonstrates continued focus on media professionals. The Italian government's COPASIR committee acknowledged official use of Graphite, while evidence points to operations across EU countries.

**Realistic risk assessment by user category**:
- **High risk**: Journalists covering government corruption, human rights defenders in authoritarian contexts, political opposition figures
- **Medium risk**: Lawyers representing sensitive cases, academic researchers studying political topics, NGO workers documenting government accountability  
- **Low risk**: Everyone else—seriously, if you're reading this blog post, you're probably not a target

## Debunking the Universal Decryption Myth (Looking at You, Instagram Posts)

Perhaps no misconception about these spyware tools causes more unnecessary panic than claims about universal encryption breaking. I see Instagram posts almost daily claiming that Pegasus can "decrypt anything" or "break Signal encryption," which fundamentally misunderstands how the spyware actually works.

Let me be crystal clear about this: **Pegasus and Graphite do not break encryption algorithms**. They don't crack AES-256 or defeat end-to-end encryption through some magical cryptographic breakthrough. What they do is much simpler and, in some ways, more concerning—they compromise your device at the endpoint level.

When Pegasus or Graphite compromises a device, it gains access to messaging applications at the operating system level, capturing text before apps like Signal or WhatsApp encrypt it for transmission. The spyware essentially reads your messages the same way you do—from the screen of your unlocked device—rather than performing cryptographic attacks on encrypted communications in transit.

Think of it this way: If someone installs a keylogger on your computer, they don't need to break your bank's encryption to steal your password—they just record what you type before it gets encrypted. That's essentially what sophisticated spyware does, but with much more advanced techniques for hiding its presence.

Cybersecurity researchers at [Malwarebytes](https://blog.malwarebytes.com/threat-intelligence/2021/07/nsopegasus/) emphasize this distinction: "The spyware can even gain access to encrypted data and messages by intercepting them prior to the encryption process." This explains why even perfectly implemented end-to-end encryption cannot protect against endpoint compromise—if an attacker controls your device, encryption of data in transit becomes irrelevant.

**This distinction matters for realistic security planning**. Claims about universal decryption create false impressions about cryptographic security while missing the actual attack surface. Effective protection focuses on preventing device compromise (through regular updates, cautious link handling, and tools like Lockdown Mode) rather than assuming encryption failures.

The next time you see a viral video claiming that some app can "decrypt everything," remember that real encryption is still incredibly strong. The threat comes from compromising endpoints, not breaking mathematics.

## Detection Myths Versus Forensic Reality

This brings us to one of my biggest pet peeves in the cybersecurity misinformation space: TikTok and Instagram videos claiming to show "signs of Pegasus infection." These videos are not just wrong—they're dangerously misleading.

I've seen creators list battery drain, slow performance, unexpected data usage, apps crashing, phone heating up, or even just "your phone acting weird" as infection indicators. This is complete garbage that fundamentally misunderstands both the sophistication of these tools and the complexity of forensic detection.

**Sophisticated spyware actively avoids obvious detection indicators**. Pegasus includes self-destruct mechanisms that eliminate evidence after 60 days without command-and-control communication. Process names are disguised to appear as legitimate iOS system services, though forensic analysis reveals patterns like "bh," "roleaccountd," and "stagingd" that trained investigators can identify.

The spyware also clears Safari caches and modifies crash reporting to reduce forensic traces. If multi-million-dollar government spyware was causing obvious performance issues, it would be pretty terrible spyware, wouldn't it?

**Actual detection requires specialized tools and expertise**. [Amnesty International's Security Lab](https://www.amnesty.org/en/latest/research/2021/07/forensic-methodology-report-how-to-catch-nso-groups-pegasus/) developed the Mobile Verification Toolkit (MVT), an open-source forensic tool that can identify Pegasus and Graphite indicators—but only through detailed analysis of device backups and system databases.

This tool is command-line based and requires considerable technical expertise. You can't just download it from the App Store and run a quick scan while watching Netflix. The forensic process involves analyzing specific databases: iOS DataUsage.sqlite and netusage.sqlite files for network communication patterns, Safari browsing history for malicious domain contacts, and iMessage account lookups for suspicious attachments.

On Android, researchers look for the "BIGPRETZEL" artifact that uniquely identifies Graphite infections, along with modifications to system partitions and WAP settings. This level of technical sophistication far exceeds anything possible through consumer-level observation of device behavior.

**Citizen Lab's detection methodology demonstrates the complexity** involved in confirming infections. Their "Athena clustering" technique requires Internet-wide scanning using specialized fingerprinting methods, while DNS cache probing involves analyzing tens of thousands of ISP caches globally.

The bottom line: If detecting sophisticated spyware was as simple as checking your battery usage, governments wouldn't spend millions of dollars on these tools. Stop trusting TikTok creators who claim they can teach you to spot nation-state malware in 60 seconds.

## The Economic Reality That Scammers Ignore

Speaking of TikTok misinformation, let's talk about those sextortion emails that claim to have infected your device with Pegasus. You know the ones—they usually demand $2,000 to $5,000 to "remove" the spyware and stop "leaking your private videos."

These scams reveal their own impossibility through basic economic analysis. Actual Pegasus deployment costs exceed $650,000 for minimal device coverage plus additional setup, maintenance, and infrastructure expenses. Criminal use at these price points makes no economic sense for typical cybercrime operations.

**NSO Group's pricing structure, revealed in court documents and investigative reporting**:
- Initial setup fee: $500,000
- 10 device licenses: $650,000 first year  
- 50 device licenses: €20.7 million annually
- 100 device licenses: €41.4 million annually
- Annual maintenance: 17% of total licensing cost

Additional infrastructure requirements include dedicated operational centers, specialized technical personnel, physical network equipment, and ongoing zero-day exploit acquisition. These costs restrict usage to well-funded government agencies rather than opportunistic criminals.

Legal and regulatory barriers add further constraints. Israeli export control laws require government approval for NSO sales, while [US sanctions specifically target commercial spyware companies](https://www.treasury.gov/ofac-sanctions-lists). Paragon Solutions attempted to circumvent these restrictions by selling its US operations to AE Industrial Partners, but regulatory oversight continues to limit distribution.

Think about it logically: If someone spent $650,000 to hack your phone, do you really think they'd demand $2,000 in Bitcoin and call it even? The pricing mismatch between actual deployment costs and scammer demands provides immediate evidence of fraudulent claims.

## What High-Risk Users Actually Need to Know

Now, if you're a journalist covering government corruption, a human rights defender in an authoritarian context, or a political opposition figure, this section is actually for you. The reality is that some people do face genuine sophisticated spyware threats, and their security planning must be very different from what I'd recommend for the average person scrolling TikTok.

For individuals who face genuine threats, security planning must assume potential compromise rather than hoping for perfect prevention. The technical capabilities of Pegasus and Graphite mean that sufficiently motivated, well-funded attackers can achieve device access despite reasonable security precautions.

**Practical security measures for high-risk users**:

Daily device reboots interrupt less persistent implants, as many spyware components don't survive restart cycles. Apple's Lockdown Mode provides unprecedented protection specifically against mercenary spyware, disabling complex web technologies, message attachments, and FaceTime calls from unknown contacts. For Android users, GrapheneOS or similar hardened operating systems offer enhanced security architectures.

**Communication security requires assuming potential endpoint compromise**. Signal's disappearing messages limit data exposure windows, while using multiple devices for different purposes reduces cross-contamination. Most importantly, sensitive discussions should occur in person when possible, recognizing that any electronic communication may be monitored.

Regular forensic analysis using tools like MVT can identify compromise, but requires technical expertise or assistance from organizations like [Access Now](https://www.accessnow.org/), Amnesty International's Security Lab, or the [Digital Security Helpline](https://www.digitalsecurityhelpline.org/). High-risk individuals should maintain relationships with technical support organizations before they need emergency assistance.

The human rights community has developed sophisticated operational security frameworks specifically for high-risk environments. Training programs from organizations like [Tactical Technology Collective](https://tacticaltech.org/) provide comprehensive approaches to digital security that account for advanced persistent threats while maintaining operational effectiveness.

But here's the key point: if you're not in one of these high-risk categories, the security measures above are overkill for your threat model. Don't let TikTok fear-mongering convince you to live like a political dissident when you're just trying to keep your Instagram photos private.

## The Bigger Picture: Fighting Surveillance and Supporting Truth

The existence of companies like NSO Group and Paragon Solutions reflects broader challenges in how democratic societies regulate surveillance technology. These tools demonstrate technical capabilities that, in different hands, could serve legitimate law enforcement purposes—the problem lies in inadequate oversight, export control failures, and insufficient accountability for misuse.

European investigations reveal the scope of surveillance industry challenges. The European Parliament's PEGA committee documented Pegasus use in EU member states, while the Italian COPASIR committee acknowledged domestic Graphite deployment. These official inquiries demonstrate that mercenary spyware operates within democratic systems, not just authoritarian regimes.

International cooperation on spyware governance remains incomplete but is evolving. The Biden administration's [Executive Order 14093](https://www.whitehouse.gov/briefing-room/presidential-actions/2023/03/27/executive-order-on-prohibition-on-use-by-the-united-states-government-of-commercial-spyware-that-poses-risks-to-national-security/) restricts federal agencies from using commercial spyware, while the EU considers comprehensive surveillance technology regulation.

Supporting press freedom and civil society organizations provides the most effective long-term protection against spyware misuse. Organizations like Citizen Lab, Amnesty International's Security Lab, and Access Now provide both technical research and direct assistance to targeted individuals. Their work creates accountability pressures that make political surveillance more costly and visible.

**What can you actually do?** Support these organizations financially if you can. Share accurate information instead of viral fear-mongering. Push back against misinformation when you see it spreading on social media. And vote for politicians who support digital rights and surveillance oversight.

## Security Through Knowledge, Not Panic

The sophisticated commercial spyware industry represents a genuine threat to democratic freedoms, but panic-driven responses serve neither security nor civil liberties. Pegasus and Graphite are expensive, technically complex tools designed for targeted political surveillance—understanding their actual capabilities and limitations enables more effective protection strategies.

For the vast majority of mobile device users, standard cybersecurity practices provide adequate protection against realistic threats. Keep your devices updated, use strong authentication, avoid suspicious links, and ignore TikTok videos claiming your battery drain means you're under government surveillance.

For journalists, activists, and others who face sophisticated threats, security planning must be proportionate to actual risk levels. This means assuming potential compromise, implementing operational security measures, and maintaining connections to technical support organizations—not living in constant fear based on social media misinformation.

Perhaps most importantly, combating surveillance technology misuse requires supporting the cybersecurity researchers, digital rights organizations, and investigative journalists who document abuse and develop protective technologies. Their work creates the technical knowledge and public accountability that make political surveillance more difficult and expensive.

The future of mobile security depends on continuing this arms race between surveillance and protection technologies, but with proper oversight, technical literacy, and support for civil society, democratic values can persist even in an age of sophisticated digital surveillance tools.

**Final reality check**: If you made it this far, you're probably not a target for million-dollar government spyware. Keep your phone updated, use common sense about suspicious links, and spend your mental energy worrying about actual problems instead of TikTok fantasies. The surveillance threats we should really be concerned about are the ones happening in plain sight—the data collection practices of major tech companies that track your every move with your explicit consent.

Now go update your phone and stop believing everything you see on social media. Your battery draining faster than usual just means your battery is getting old, not that the government is watching you scroll through cat videos.