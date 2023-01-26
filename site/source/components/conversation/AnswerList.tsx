import { DottedName } from 'modele-social'
import { PublicodesExpression, RuleNode, utils } from 'publicodes'
import { useCallback, useContext, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { answerQuestion, resetSimulation } from '@/actions/actions'
import { resetCompany } from '@/actions/companyActions'
import { EvaluatedRule, useEngine } from '@/components/utils/EngineContext'
import { useNextQuestions } from '@/components/utils/useNextQuestion'
import { Message, PopoverWithTrigger } from '@/design-system'
import { Button } from '@/design-system/buttons'
import { Emoji } from '@/design-system/emoji'
import { Grid, Spacing } from '@/design-system/layout'
import PopoverConfirm from '@/design-system/popover/PopoverConfirm'
import { Strong } from '@/design-system/typography'
import { H2, H3 } from '@/design-system/typography/heading'
import { Link } from '@/design-system/typography/link'
import { Body, Intro } from '@/design-system/typography/paragraphs'
import { CurrentSimulatorDataContext } from '@/pages/Simulateurs/metadata'
import {
	answeredQuestionsSelector,
	companySituationSelector,
	situationSelector,
} from '@/selectors/simulationSelectors'
import { evaluateQuestion } from '@/utils'

import Value from '../EngineValue'
import { JeDonneMonAvis } from '../JeDonneMonAvis'
import { ExplicableRule } from './Explicable'
import RuleInput from './RuleInput'

type AnswerListProps = {
	onClose: () => void
	children?: React.ReactNode
}

export default function AnswerList({ onClose, children }: AnswerListProps) {
	const { t } = useTranslation()
	const currentSimulatorData = useContext(CurrentSimulatorDataContext)
	const dispatch = useDispatch()
	const engine = useEngine()
	const situation = useSelector(situationSelector)
	const companySituation = useSelector(companySituationSelector)
	const passedQuestions = useSelector(answeredQuestionsSelector)
	const answeredAndPassedQuestions = useMemo(
		() =>
			(Object.keys(situation) as DottedName[])
				.filter(
					(answered) => !passedQuestions.some((passed) => answered === passed)
				)
				.concat(passedQuestions)
				.filter((answered) => !(answered in companySituation))
				.filter(
					(dottedName) =>
						engine.getRule(dottedName).rawNode.question !== undefined
				)
				.map((dottedName) => engine.getRule(dottedName)),
		[engine, passedQuestions, situation, companySituation]
	)
	const nextSteps = useNextQuestions().map((dottedName) =>
		engine.evaluate(engine.getRule(dottedName))
	) as Array<EvaluatedRule>
	const companyQuestions = useMemo(
		() =>
			(
				(Object.keys(companySituation) as DottedName[]).map((dottedName) =>
					engine.evaluate(engine.getRule(dottedName))
				) as Array<EvaluatedRule>
			).sort((a, b) => (a.title < b.title ? -1 : 1)),
		[engine, companySituation]
	)

	const siret = engine.evaluate('établissement . SIRET').nodeValue as string

	return (
		<div className="answer-list">
			<H2>
				<Emoji emoji="📋 " />
				<Trans>Ma situation</Trans>
			</H2>

			{!!answeredAndPassedQuestions.length && (
				<>
					<H3>
						<Trans>Simulation en cours</Trans>
					</H3>

					<StepsTable {...{ rules: answeredAndPassedQuestions, onClose }} />
					{children}
					<div
						className="print-hidden"
						css={`
							text-align: center;
						`}
					>
						<PopoverConfirm
							small
							trigger={(buttonProps) => (
								<Button {...buttonProps}>
									<Trans>Effacer mes réponses</Trans>
								</Button>
							)}
							onConfirm={() => {
								dispatch(resetSimulation())
							}}
							title={t('Êtes-vous sûr de vouloir effacer vos réponses ?')}
						>
							<Intro>
								<Trans>Cette opération n'est pas réversible.</Trans>
							</Intro>
						</PopoverConfirm>
					</div>
				</>
			)}

			{currentSimulatorData?.pathId === 'simulateurs.salarié' && (
				<div
					className="print-hidden"
					css={`
						text-align: center;
					`}
				>
					<Spacing md />
					<JeDonneMonAvis />
				</div>
			)}

			{companyQuestions.length > 0 && (
				<>
					<H3>
						<Trans>Mon entreprise</Trans>
					</H3>
					<div className="print-hidden">
						<Message type="secondary" border={false} icon>
							<Body>
								<div
									css={`
										display: flex;
										align-items: center;
									`}
								>
									<span
										css={`
											flex-shrink: 1;
										`}
									>
										Les réponses liées à l'entreprise sont{' '}
										<Strong>automatiquement sauvegardées</Strong> entre les
										simulations.
									</span>
									<div
										css={`
											flex: 1;
											min-width: fit-content;
											text-align: right;
										`}
									>
										<PopoverConfirm
											small
											trigger={(buttonProps) => (
												<Button
													light
													color="secondary"
													size="XS"
													{...buttonProps}
												>
													<Trans>Tout réinitialiser</Trans>{' '}
												</Button>
											)}
											onConfirm={() => {
												dispatch(resetSimulation())
												dispatch(resetCompany())
											}}
											title={t(
												'Attention, vos données sauvegardées seront supprimées de manière définitive.'
											)}
										></PopoverConfirm>
									</div>
								</div>
							</Body>
						</Message>
						<Spacing xs />
					</div>
					<div
						className="print-hidden"
						css={`
							text-align: center;
						`}
					></div>
					<StepsTable {...{ rules: companyQuestions, onClose }} />
					<Spacing md />
					<div className="print-hidden">
						<Body css={{ marginTop: 0 }}>
							{t(
								'gérer.ressources.annuaire-entreprises.body',
								'Retrouvez toutes les informations publiques concernant votre entreprise sur'
							)}{' '}
							<Link
								aria-label={t(
									'gérer.ressources.annuaire-entreprises.aria-label',
									'Annuaire des Entreprises, nouvelle fenêtre'
								)}
								href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${siret}`}
							>
								Annuaire des Entreprises.
							</Link>
						</Body>
					</div>
				</>
			)}

			{!!nextSteps.length && (
				<div className="print-hidden">
					<H2>
						<Emoji emoji="🔮 " />
						<Trans>Prochaines questions</Trans>
					</H2>
					<StepsTable {...{ rules: nextSteps, onClose }} />
				</div>
			)}
		</div>
	)
}

function StepsTable({
	rules,
}: {
	rules: Array<EvaluatedRule | RuleNode>
	onClose: () => void
}) {
	const { t } = useTranslation()

	return (
		<>
			{rules
				.filter((rule) => !('nodeValue' in rule) || rule.nodeValue !== null)
				.map((rule) => (
					<StyledAnswerList container key={rule.dottedName}>
						<Grid item xs>
							{rule.title}
							<ExplicableRule
								aria-label={t('En savoir plus')}
								light
								dottedName={rule.dottedName}
							/>
						</Grid>
						<StyledAnswer item xs="auto">
							<AnswerElement {...rule} />
						</StyledAnswer>
					</StyledAnswerList>
				))}
		</>
	)
}

function AnswerElement(rule: RuleNode) {
	const dispatch = useDispatch()
	const engine = useEngine()

	const { t } = useTranslation()

	const parentDottedName = utils.ruleParent(rule.dottedName) as DottedName
	const questionDottedName = rule.rawNode.question
		? (rule.dottedName as DottedName)
		: parentDottedName && engine.getRule(parentDottedName).rawNode.API
		? parentDottedName
		: undefined

	const handleChange = useCallback(
		(value: PublicodesExpression | undefined) => {
			questionDottedName && dispatch(answerQuestion(questionDottedName, value))
		},
		[dispatch, questionDottedName]
	)

	return questionDottedName ? (
		<PopoverWithTrigger
			small
			trigger={(buttonProps) => (
				<Link
					{...buttonProps}
					role="button"
					aria-haspopup="dialog"
					aria-label="Modifier"
				>
					<Value expression={rule.dottedName} linkToRule={false} />{' '}
					<span className="print-hidden">
						<Emoji emoji="✏" alt="Modifier" aria-hidden={false} />
					</span>
				</Link>
			)}
		>
			{(onClose) => (
				<>
					<form onSubmit={onClose}>
						<H3>
							{evaluateQuestion(engine, engine.getRule(questionDottedName))}
							<ExplicableRule
								light
								dottedName={questionDottedName}
								aria-label={t('En savoir plus')}
							/>
						</H3>
						<RuleInput
							dottedName={questionDottedName}
							onChange={handleChange}
							autoFocus
							showSuggestions={false}
							onSubmit={onClose}
						/>
					</form>

					<Spacing lg />
					<Button size="XS" onPress={onClose}>
						Continuer
					</Button>
					<Spacing md />
				</>
			)}
		</PopoverWithTrigger>
	) : (
		<Value expression={rule.dottedName} linkToRule={false} />
	)
}

const StyledAnswer = styled(Grid)`
	text-align: right;
`
const StyledAnswerList = styled(Grid)`
	margin: ${({ theme }) => `${theme.spacings.md} 0`};
	align-items: baseline;
	justify-content: flex-end;
	gap: ${({ theme }) => theme.spacings.sm};
	color: ${({ theme }) =>
		theme.darkMode
			? theme.colors.bases.primary[100]
			: theme.colors.extended.dark[500]};
	font-family: ${({ theme }) => theme.fonts.main};
	:nth-child(2n) {
		background-color: ${({ theme }) =>
			theme.darkMode
				? theme.colors.extended.dark[500]
				: theme.colors.bases.primary[100]};
		color: ${({ theme }) => theme.colors.bases.primary[800]};
		color-adjust: exact !important;
		outline: solid
			${({ theme }) =>
				`calc(${theme.spacings.md} / 2) ${
					theme.darkMode
						? theme.colors.extended.dark[500]
						: theme.colors.bases.primary[100]
				}`};
	}
`
