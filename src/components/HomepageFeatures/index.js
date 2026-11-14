import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Kernel and Boot',
    description: (
      <>
        Linux kernel for Android, device tree, bootloader, verified boot, init
        and system startup.
      </>
    ),
  },
  {
    title: 'Native Layer and HAL',
    description: (
      <>
        Bionic, native daemons, Treble, AIDL and HIDL HALs, and the graphics,
        audio and camera stacks.
      </>
    ),
  },
  {
    title: 'Runtime and Framework',
    description: (
      <>
        ART, Binder IPC, system_server and core services, and how apps
        interact with the platform.
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md padding-vert--lg">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
