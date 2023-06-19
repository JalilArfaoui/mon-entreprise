import { Trans } from 'react-i18next'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { TrackChapter } from '@/components/ATInternetTracking'
import SimulateurOrAssistantPage from '@/components/SimulateurOrAssistantPage'
import { ScrollToTop } from '@/components/utils/Scroll'
import { Link } from '@/design-system/typography/link'
import useSimulatorsData from '@/hooks/useSimulatorsData'
import { useSitePaths } from '@/sitePaths'

import SocialSecurity from './sécurité-sociale'

export default function Gérer() {
	const { relativeSitePaths, absoluteSitePaths } = useSitePaths()
	const location = useLocation()
	const simulateurs = useSimulatorsData()

	const back = (
		<Link
			noUnderline
			to={absoluteSitePaths.assistants['pour-mon-entreprise'].index}
		>
			<span aria-hidden>←</span> <Trans>Retour à mon activité</Trans>
		</Link>
	)

	return (
		<>
			<ScrollToTop key={location.pathname} />

			<Routes>
				<Route
					index
					element={
						<Navigate to={absoluteSitePaths.simulateursEtAssistants} replace />
					}
				/>
				<Route
					path={relativeSitePaths.assistants.sécuritéSociale}
					element={
						<TrackChapter chapter1="gerer">
							{back}
							<SocialSecurity />
						</TrackChapter>
					}
				/>

				{Object.entries(simulateurs)
					.filter(([, simu]) => simu.pathId.startsWith('assistants.'))
					.map(([, simu]) => (
						<Route
							key={simu.path}
							path={
								simu.path.replace(absoluteSitePaths.assistants.index, '') + '/*'
							}
							element={
								<>
									<SimulateurOrAssistantPage />
								</>
							}
						/>
					))}
				<Route
					path="*"
					element={
						<Navigate
							to={decodeURI(location.pathname).replace(
								absoluteSitePaths.assistants.index,
								absoluteSitePaths.assistants['pour-mon-entreprise'].index
							)}
							replace
						/>
					}
				/>
			</Routes>
		</>
	)
}
