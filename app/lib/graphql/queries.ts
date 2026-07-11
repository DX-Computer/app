export const GRANTS_QUERY = `
  query Grants {
    grants(first: 200, orderBy: grantId, orderDirection: asc, where: { removed: false }) {
      id
      grantId
      kitId
      creator
      purposeHash
      contentUri
      budget
      raised
      totalShares
      funders
      createdAtBlock
      createdAtTimestamp
      transactionHash
    }
  }
`;

export const OFFERS_QUERY = `
  query Offers {
    offers(first: 200, orderBy: offerId, orderDirection: asc, where: { exists: true }) {
      id
      offerId
      fabricator
      kitId
      version
      designHash
      contentUri
      price
      sliceBps
      quantity
      grantId
      grantBps
      grantLinked
      exists
    }
  }
`;

export const AGENTS_QUERY = `
  query Agents {
    agents(first: 200, orderBy: agentId, orderDirection: asc) {
      id
      agentId
      owner
      modelHash
      hardwareHash
      contentUri
      createdAtBlock
      createdAtTimestamp
      transactionHash
      kits(where: { included: true }) {
        kitId
      }
    }
  }
`;

export const PROPOSALS_QUERY = `
  query Proposals {
    councilProposals(first: 200, orderBy: proposalId, orderDirection: desc) {
      id
      proposalId
      kind
      contentUri
      target
      project
      banned
      value
      extra
      start
      end
      executed
      yes
      no
      createdAtTimestamp
      transactionHash
    }
  }
`;

export const KITS_QUERY = `
  query Kits {
    kits(first: 200, orderBy: kitId, orderDirection: desc) {
      id
      kitId
      mode
      ownerTag
      parentId
      version
      designHash
      contentUri
      revoked
      createdAtBlock
      createdAtTimestamp
      updatedAtTimestamp
      transactionHash
      versions(orderBy: version, orderDirection: asc) {
        version
        contentUri
        designHash
        createdAtBlock
        createdAtTimestamp
        transactionHash
      }
      grants(where: { removed: false }) {
        id
        grantId
        contentUri
        budget
        raised
        funders
      }
      offers(where: { exists: true }) {
        id
        offerId
        contentUri
        price
        quantity
        sliceBps
        grantLinked
      }
      agents(where: { included: true }) {
        agent {
          agentId
          contentUri
        }
      }
    }
  }
`;

export const CREATOR_BANS_QUERY = `
  query CreatorBans {
    creatorBans(orderBy: createdAtTimestamp, orderDirection: desc, first: 200) {
      creator
      actor
      banned
      createdAtTimestamp
      transactionHash
    }
  }
`;

export const ENROLLMENTS_QUERY = `
  query Enrollments {
    enrollments(first: 1000, orderBy: leafIndex, orderDirection: asc) {
      commitment
      leafIndex
    }
  }
`;

export const BALANCE_LEAVES_QUERY = `
  query BalanceLeaves {
    balanceLeaves(first: 1000, orderBy: leafIndex, orderDirection: asc) {
      balanceKey
      balance
      leafIndex
    }
  }
`;

export const PROPOSAL_DETAIL_QUERY = `
  query Proposal($id: ID!) {
    councilProposal(id: $id) {
      id
      proposalId
      kind
      contentUri
      target
      project
      banned
      value
      extra
      start
      end
      executed
      yes
      no
      createdAtTimestamp
      transactionHash
    }
  }
`;

export const GRANT_DETAIL_QUERY = `
  query Grant($id: ID!) {
    grant(id: $id) {
      id
      grantId
      kitId
      creator
      purposeHash
      contentUri
      budget
      raised
      totalShares
      funders
      removed
      createdAtBlock
      createdAtTimestamp
      updatedAtTimestamp
      transactionHash
    }
  }
`;

export const TREELINER_QUERY = `
  query Treeliner($id: ID!) {
    treeliner(id: $id) {
      id
      address
      totalStaked
      totalClaimed
      grantsFunded
    }
  }
`;

export const GRANTS_BY_FUNDER_QUERY = `
  query GrantsByFunder($funder: Bytes!) {
    grantFunders(where: { funder: $funder }, first: 200) {
      shares
      grant {
        id
        grantId
        kitId
        creator
        contentUri
        budget
        raised
        funders
        removed
      }
    }
  }
`;

export const GRANT_FUNDERS_QUERY = `
  query GrantFunders($id: String!) {
    grantFunders(where: { grant: $id }, first: 200) {
      funder
      shares
    }
  }
`;

export const GRANT_OFFERS_QUERY = `
  query GrantOffers($grantId: BigInt!) {
    offers(
      where: { grantId: $grantId, grantLinked: true, exists: true }
      first: 200
    ) {
      id
      offerId
      kitId
      fabricator
      contentUri
      price
      quantity
      sliceBps
      grantLinked
    }
  }
`;

export const DASHBOARD_QUERY = `
  query Dashboard($user: Bytes!, $userId: ID!) {
    kits(where: { creator: $user }, orderBy: kitId, orderDirection: desc, first: 200) {
      kitId
      contentUri
      revoked
    }
    offers(where: { fabricator: $user }, orderBy: offerId, orderDirection: desc, first: 200) {
      offerId
      contentUri
      exists
      price
      quantity
    }
    grants(where: { creator: $user }, orderBy: grantId, orderDirection: desc, first: 200) {
      grantId
      contentUri
      removed
      budget
      raised
    }
    agents(where: { owner: $user }, orderBy: agentId, orderDirection: desc, first: 200) {
      agentId
      contentUri
    }
    contents(where: { author: $user }, orderBy: contentId, orderDirection: desc, first: 200) {
      contentId
      contentUri
      canonicalTag
      revoked
      createdAtTimestamp
    }
    orders(where: { buyer: $user }, orderBy: orderId, orderDirection: desc, first: 200) {
      orderId
      offerId
      status
      createdAtTimestamp
      offer {
        contentUri
      }
    }
    councilProposals(where: { proposer: $user }, orderBy: proposalId, orderDirection: desc, first: 200) {
      proposalId
      kind
      contentUri
      executed
      end
      yes
      no
    }
    creatorBans(where: { actor: $user }, orderBy: createdAtTimestamp, orderDirection: desc, first: 200) {
      creator
      banned
      createdAtTimestamp
      transactionHash
    }
    grantFunders(where: { funder: $user }, first: 200) {
      shares
      grant {
        grantId
        contentUri
        removed
      }
    }
    treeliner(id: $userId) {
      totalStaked
      totalClaimed
      grantsFunded
    }
    allKits: kits(first: 1000) {
      kitId
    }
    allGrants: grants(first: 1000) {
      grantId
    }
    allOffers: offers(first: 1000) {
      offerId
    }
    allProposals: councilProposals(first: 1000) {
      proposalId
    }
  }
`;

export const ANON_OWNED_QUERY = `
  query AnonOwned {
    kits(where: { mode: 1 }, orderBy: kitId, orderDirection: desc, first: 500) {
      kitId
      contentUri
      ownerTag
      revoked
      versions(orderBy: version, orderDirection: asc, first: 1) {
        designHash
      }
    }
    contents(where: { anonymous: true }, orderBy: contentId, orderDirection: desc, first: 500) {
      contentId
      contentUri
      ownerTag
      contentHash
      canonicalTag
      revoked
      createdAtTimestamp
    }
  }
`;

export const MY_ORDERS_QUERY = `
  query MyOrders($me: Bytes!) {
    bought: orders(where: { buyer: $me }, orderBy: orderId, orderDirection: desc, first: 200) {
      orderId
      offerId
      status
      stage
      deadline
      total
      slice
      grantSlice
      cyberSlice
      grantId
      quantity
      createdAtTimestamp
      transactionHash
      offer {
        contentUri
      }
    }
    sold: orders(where: { offer_: { fabricator: $me } }, orderBy: orderId, orderDirection: desc, first: 200) {
      orderId
      offerId
      buyer
      status
      stage
      deadline
      total
      slice
      grantSlice
      cyberSlice
      grantId
      quantity
      encryptedShipping
      createdAtTimestamp
      transactionHash
      offer {
        contentUri
      }
    }
  }
`;

export const ORDERS_BY_OFFER_QUERY = `
  query OrdersByOffer($offerId: BigInt!) {
    orders(where: { offerId: $offerId }, orderBy: orderId, orderDirection: desc, first: 200) {
      orderId
      buyer
      quantity
      status
      stage
      createdAtTimestamp
      transactionHash
    }
  }
`;

export const OFFER_DETAIL_QUERY = `
  query Offer($id: ID!) {
    offer(id: $id) {
      id
      offerId
      fabricator
      kitId
      version
      designHash
      contentUri
      price
      sliceBps
      quantity
      grantId
      grantBps
      grantLinked
      cyberSwagBps
      confirmWindow
      agents {
        agentId
      }
      exists
      createdAtBlock
      createdAtTimestamp
      updatedAtTimestamp
      transactionHash
    }
  }
`;

export const AGENTS_BY_OWNER_QUERY = `
  query AgentsByOwner($owner: Bytes!) {
    agents(
      where: { owner: $owner }
      orderBy: agentId
      orderDirection: asc
      first: 200
    ) {
      id
      agentId
      owner
      modelHash
      hardwareHash
      contentUri
      kits(where: { included: true }) {
        kitId
      }
    }
  }
`;

export const AGENT_DETAIL_QUERY = `
  query Agent($id: ID!) {
    agent(id: $id) {
      id
      agentId
      owner
      modelHash
      hardwareHash
      contentUri
      createdAtBlock
      createdAtTimestamp
      transactionHash
      kits(where: { included: true }) {
        kitId
      }
      results {
        kitId
        resultHash
        contentUri
        transactionHash
      }
    }
  }
`;

export const KIT_VERSION_QUERY = `
  query KitVersion($id: ID!) {
    kit(id: $id) {
      kitId
      version
    }
  }
`;

export const COMMENTS_QUERY = `
  query Comments($canonicalTag: Bytes!) {
    contents(
      where: { canonicalTag: $canonicalTag, revoked: false }
      orderBy: contentId
      orderDirection: desc
      first: 200
    ) {
      id
      contentId
      author
      ownerTag
      canonicalTag
      contentHash
      contentUri
      anonymous
      transactionHash
    }
  }
`;
